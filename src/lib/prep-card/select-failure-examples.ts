/**
 * Select verified failing excerpts per focus measure for WAS/NOW (+ also).
 * Quotes that do not exact-match cleaned text are dropped, not repaired.
 * No quote may appear more than once on the card (caller shares usedQuotes).
 *
 * For ask-based measures (2, 3, 7): only spans the coding call marked as
 * asks. Primary gets one rewrite; up to three additional failings are listed
 * unrewritten. Measure 4 is conclusion evidence only — no rewrite, no list.
 * If no valid span exists, omit the block.
 */

import type { SermonApplicationCoding } from "./counters-coding";
import {
  hasFrameBreak,
  headPattern,
  outlinePoints,
  type HeadPattern,
} from "./counters-frame";
import {
  terminalResidue,
} from "./counters-parser";
import { verifyQuoteInText } from "./landing-zone";
import type { PrepMeasureId } from "./measures";
import { finalTwoSentences } from "./select-strength-examples";
import {
  cleanSermonText,
  detectPrepSourceFormat,
} from "./text";

/** Ask-marker the rewrite must satisfy. */
export type PrepAskMarker = "cost" | "visible" | "reciprocal";

export type PrepFailureExample = {
  measureId: PrepMeasureId;
  sermonId: string;
  sermonTitle: string;
  quote: string;
  /** Offset into cleaned manuscript; stored for audit. */
  offset: number;
  /** Present when the Was quote is a coded ask that failed this marker. */
  marker: PrepAskMarker | null;
};

/** One Was primary plus optional unrewritten pattern list. */
export type PrepFocusFailureBundle = {
  primary: PrepFailureExample;
  /** Additional verified failings; never rewritten. Empty when none. */
  also: PrepFailureExample[];
};

type SermonRef = {
  id: string;
  title: string;
  content: string;
  intakePath?: string | null;
};

const RECIPROCAL =
  /\b(one another|each other|the body|your brother|your sister|someone in (?:the|this) church|fellow (?:believer|member)s?|the person next to you)\b/i;

/** Cap on unrewritten pattern-list quotes beneath Was/Now. */
export const FOCUS_ALSO_CAP = 3;

/** Normalize for cross-measure dedupe. */
export function quoteDedupeKey(quote: string): string {
  return quote.trim().replace(/\s+/g, " ").toLowerCase();
}

export function askFailsReciprocal(quote: string): boolean {
  return !RECIPROCAL.test(quote);
}

function verifyOrDrop(
  raw: string,
  quote: string,
): { quote: string; offset: number } | null {
  const cleaned = cleanSermonText(raw);
  const offset = verifyQuoteInText(cleaned, quote);
  if (offset == null) {
    return null;
  }
  return { quote, offset };
}

function collectAskFailures(
  measureId: 2 | 3,
  askCoding: SermonApplicationCoding[],
  sermons: SermonRef[],
  usedQuotes: Set<string>,
  limit: number,
): PrepFailureExample[] {
  const marker: PrepAskMarker = measureId === 2 ? "visible" : "cost";
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  const out: PrepFailureExample[] = [];
  for (const row of askCoding) {
    if (out.length >= limit) {
      break;
    }
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const ask of row.asks) {
      if (out.length >= limit) {
        break;
      }
      const failed =
        measureId === 2 ? !ask.named_object : !ask.named_cost;
      if (!failed) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, ask.quote);
      if (!verified) {
        continue;
      }
      const key = quoteDedupeKey(verified.quote);
      if (usedQuotes.has(key)) {
        continue;
      }
      usedQuotes.add(key);
      out.push({
        measureId,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
        marker,
      });
    }
  }
  return out;
}

/**
 * Measure 7: only coded asks that have no reciprocal person as object.
 * Staging notes and illustration cues are never candidates.
 */
function collectNonReciprocalCodedAsks(
  askCoding: SermonApplicationCoding[],
  sermons: SermonRef[],
  usedQuotes: Set<string>,
  limit: number,
): PrepFailureExample[] {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  const out: PrepFailureExample[] = [];
  for (const row of askCoding) {
    if (out.length >= limit) {
      break;
    }
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const ask of row.asks) {
      if (out.length >= limit) {
        break;
      }
      if (!askFailsReciprocal(ask.quote)) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, ask.quote);
      if (!verified) {
        continue;
      }
      const key = quoteDedupeKey(verified.quote);
      if (usedQuotes.has(key)) {
        continue;
      }
      usedQuotes.add(key);
      out.push({
        measureId: 7,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
        marker: "reciprocal",
      });
    }
  }
  return out;
}

function frameBreakPoint(points: string[]): string | null {
  if (points.length < 3 || !hasFrameBreak(points)) {
    return null;
  }
  const patterns = points.map(headPattern);
  const counts = new Map<HeadPattern, number>();
  for (const pattern of patterns) {
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }
  let majority: HeadPattern | null = null;
  let majorityCount = 0;
  for (const [pattern, count] of counts) {
    if (count > majorityCount) {
      majority = pattern;
      majorityCount = count;
    }
  }
  if (majority == null) {
    return null;
  }
  const idx = patterns.findIndex((pattern) => pattern !== majority);
  return idx >= 0 ? points[idx]! : null;
}

function pickFrameBreakFailure(
  sermons: SermonRef[],
  usedQuotes: Set<string>,
): PrepFailureExample | null {
  for (const sermon of sermons) {
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const point = frameBreakPoint(outlinePoints(cleaned));
    if (!point) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, point);
    if (!verified) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (usedQuotes.has(key)) {
      continue;
    }
    usedQuotes.add(key);
    return {
      measureId: 5,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
      marker: null,
    };
  }
  return null;
}

/**
 * Measure 4 focus evidence: final two sentences of an unfinished
 * conclusion. No rewrite, no pattern list.
 */
function looksLikeFileHeader(text: string): boolean {
  return (
    /\[DATE\]|\[SERVICE\]/i.test(text) ||
    /Ground-up rebuild/i.test(text)
  );
}

function pickConclusionFailure(
  sermons: SermonRef[],
  usedQuotes: Set<string>,
): PrepFailureExample | null {
  for (const sermon of sermons) {
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    if (terminalResidue(cleaned) === 0) {
      continue;
    }
    const closing = finalTwoSentences(cleaned);
    if (!closing || looksLikeFileHeader(closing)) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, closing);
    if (!verified) {
      continue;
    }
    const end = verified.offset + verified.quote.length;
    if (end < cleaned.length * 0.7) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (usedQuotes.has(key)) {
      continue;
    }
    usedQuotes.add(key);
    return {
      measureId: 4,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
      marker: null,
    };
  }
  return null;
}

function toBundle(
  rows: PrepFailureExample[],
  allowAlso: boolean,
): PrepFocusFailureBundle | null {
  if (rows.length === 0) {
    return null;
  }
  const [primary, ...rest] = rows;
  return {
    primary: primary!,
    also: allowAlso ? rest.slice(0, FOCUS_ALSO_CAP) : [],
  };
}

/**
 * One failure bundle per focus measure id when a verified excerpt exists.
 * Ask measures may include an unrewritten pattern list (up to three).
 * Quotes claimed here are added to `usedQuotes`.
 */
export function selectFocusFailureExamples(params: {
  focusIds: PrepMeasureId[];
  sermons: SermonRef[];
  askCoding: SermonApplicationCoding[];
  usedQuotes?: Set<string>;
}): PrepFocusFailureBundle[] {
  const usedQuotes = params.usedQuotes ?? new Set<string>();
  const out: PrepFocusFailureBundle[] = [];
  const askLimit = 1 + FOCUS_ALSO_CAP;

  for (const id of params.focusIds) {
    let bundle: PrepFocusFailureBundle | null = null;
    if (id === 2) {
      bundle = toBundle(
        collectAskFailures(2, params.askCoding, params.sermons, usedQuotes, askLimit),
        true,
      );
    } else if (id === 3) {
      bundle = toBundle(
        collectAskFailures(3, params.askCoding, params.sermons, usedQuotes, askLimit),
        true,
      );
    } else if (id === 4) {
      const primary = pickConclusionFailure(params.sermons, usedQuotes);
      bundle = primary ? { primary, also: [] } : null;
    } else if (id === 5) {
      const primary = pickFrameBreakFailure(params.sermons, usedQuotes);
      bundle = primary ? { primary, also: [] } : null;
    } else if (id === 7) {
      bundle = toBundle(
        collectNonReciprocalCodedAsks(
          params.askCoding,
          params.sermons,
          usedQuotes,
          askLimit,
        ),
        true,
      );
    }
    if (bundle) {
      out.push(bundle);
    }
  }
  return out;
}
