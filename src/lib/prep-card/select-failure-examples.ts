/**
 * Select one verified failing excerpt per focus measure for WAS/NOW.
 * Quotes that do not exact-match cleaned text are dropped, not repaired.
 * No quote may appear under more than one focus item.
 *
 * For ask-based measures (2, 3, 7): only spans the coding call marked as
 * asks. If no failing ask exists, omit Was/Now — do not reach for any quote.
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

type SermonRef = {
  id: string;
  title: string;
  content: string;
  intakePath?: string | null;
};

const RECIPROCAL =
  /\b(one another|each other|the body|your brother|your sister|someone in (?:the|this) church|fellow (?:believer|member)s?|the person next to you)\b/i;

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

function pickAskFailure(
  measureId: 2 | 3,
  askCoding: SermonApplicationCoding[],
  sermons: SermonRef[],
  usedQuotes: Set<string>,
): PrepFailureExample | null {
  const marker: PrepAskMarker = measureId === 2 ? "visible" : "cost";
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  for (const row of askCoding) {
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const ask of row.asks) {
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
      return {
        measureId,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
        marker,
      };
    }
  }
  return null;
}

/**
 * Measure 7: only coded asks that have no reciprocal person as object.
 * Staging notes and illustration cues are never candidates.
 */
function pickNonReciprocalCodedAsk(
  askCoding: SermonApplicationCoding[],
  sermons: SermonRef[],
  usedQuotes: Set<string>,
): PrepFailureExample | null {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  for (const row of askCoding) {
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const ask of row.asks) {
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
      return {
        measureId: 7,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
        marker: "reciprocal",
      };
    }
  }
  return null;
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
 * conclusion. No rewrite — a conclusion is not a one-line fix.
 * File headers and front-matter are never candidates.
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
    // Must sit in the conclusion region, not the top of the file.
    const end = verified.offset + verified.quote.length;
    if (end < cleaned.length * 0.7) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (usedQuotes.has(key)) {
      continue;
    }
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

/**
 * One failure example per focus measure id, when a verified excerpt exists.
 * Missing measures simply omit WAS/NOW rather than inventing text.
 * Quotes are unique across the returned set.
 */
export function selectFocusFailureExamples(params: {
  focusIds: PrepMeasureId[];
  sermons: SermonRef[];
  askCoding: SermonApplicationCoding[];
}): PrepFailureExample[] {
  const out: PrepFailureExample[] = [];
  const usedQuotes = new Set<string>();
  for (const id of params.focusIds) {
    let example: PrepFailureExample | null = null;
    if (id === 2) {
      example = pickAskFailure(2, params.askCoding, params.sermons, usedQuotes);
    } else if (id === 3) {
      example = pickAskFailure(3, params.askCoding, params.sermons, usedQuotes);
    } else if (id === 4) {
      example = pickConclusionFailure(params.sermons, usedQuotes);
    } else if (id === 5) {
      example = pickFrameBreakFailure(params.sermons, usedQuotes);
    } else if (id === 7) {
      example = pickNonReciprocalCodedAsk(
        params.askCoding,
        params.sermons,
        usedQuotes,
      );
    }
    if (example) {
      usedQuotes.add(quoteDedupeKey(example.quote));
      out.push(example);
    }
  }
  return out;
}
