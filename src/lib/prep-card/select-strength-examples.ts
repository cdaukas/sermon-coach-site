/**
 * Up to five verified evidence excerpts per strength measure.
 * Same quote discipline as focus: counter-selected, Unicode-folded exact
 * match, offset stored, non-matches dropped. No rewrite. Fewer is fine;
 * never pad or repeat.
 *
 * Measures 4 and 5 have no short quotable span:
 * - 4: final two sentences of a finished conclusion
 * - 5: the point heads in a column (the Frame-Break artifact)
 */

import type { SermonApplicationCoding } from "./counters-coding";
import type { SermonNamingCoding } from "./counters-naming";
import { measure12AddressMatch } from "./counters-address";
import {
  measure5OutlineHomogeneous,
  outlinePoints,
} from "./counters-frame";
import {
  measure4ConclusionFinished,
  measure7HasReciprocalAsk,
} from "./counters-parser";
import { verifyQuoteInText } from "./landing-zone";
import type { PrepMeasureId } from "./measures";
import { quoteDedupeKey } from "./select-failure-examples";
import {
  cleanSermonText,
  detectPrepSourceFormat,
} from "./text";
import type { PrepStrengthExample } from "./types";

type SermonRef = {
  id: string;
  title: string;
  content: string;
  intakePath?: string | null;
};

const RECIPROCAL =
  /\b(one another|each other|the body|your brother|your sister|someone in (?:the|this) church|fellow (?:believer|member)s?|the person next to you)\b/i;

const IMPERATIVE_CLAUSE =
  /(?:^|[.!?]\s+|\n)\s*((?:Go|Come|Give|Take|Make|Look|Listen|Stop|Start|Pray|Serve|Love|Bear|Speak|Tell|Ask|Call|Write|Turn|Consider|Remember|Trust|Believe|Rest|Confess|Forgive|Repent|Let|Do|Don't|Be|Seek|Hold|Encourage|Welcome|Invite|Show|Bring)\b[^.!?\n]{0,100})/g;

const SENTENCE =
  /[^.!?]+[.!?]+(?:["'`”’)]+)?/g;

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

/** Last two sentence spans from cleaned text. */
export function finalTwoSentences(cleaned: string): string | null {
  const matches = cleaned.match(SENTENCE);
  if (!matches || matches.length === 0) {
    return null;
  }
  const slice =
    matches.length === 1
      ? matches[0]!.trim()
      : `${matches[matches.length - 2]!.trim()} ${matches[matches.length - 1]!.trim()}`;
  return slice.length >= 12 ? slice : null;
}

function pickReciprocalAskSpan(cleaned: string): string | null {
  const re = new RegExp(IMPERATIVE_CLAUSE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    const span = (match[1] ?? "").trim();
    if (span.length < 8) {
      continue;
    }
    const window = cleaned.slice(match.index, match.index + 110);
    if (!RECIPROCAL.test(window)) {
      continue;
    }
    return span;
  }
  return null;
}

function exampleKey(example: PrepStrengthExample): string {
  if (example.kind === "point_heads" && example.heads?.length) {
    return quoteDedupeKey(example.heads.join("\n"));
  }
  return quoteDedupeKey(example.quote);
}

/**
 * Prefer different sermons first; then fill from remaining unique quotes
 * up to `limit`. Never pad or repeat.
 */
function pickUpTo(
  candidates: PrepStrengthExample[],
  limit: number,
  usedQuotes: Set<string>,
): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  const usedKeys = new Set<string>();
  const usedSermons = new Set<string>();

  for (const candidate of candidates) {
    if (out.length >= limit) {
      break;
    }
    const key = exampleKey(candidate);
    if (usedQuotes.has(key) || usedKeys.has(key) || usedSermons.has(candidate.sermonId)) {
      continue;
    }
    usedKeys.add(key);
    usedSermons.add(candidate.sermonId);
    out.push(candidate);
  }

  if (out.length < limit) {
    for (const candidate of candidates) {
      if (out.length >= limit) {
        break;
      }
      const key = exampleKey(candidate);
      if (usedQuotes.has(key) || usedKeys.has(key)) {
        continue;
      }
      usedKeys.add(key);
      out.push(candidate);
    }
  }

  for (const row of out) {
    usedQuotes.add(exampleKey(row));
  }
  return out;
}

/** Cap on verified strength evidence quotes per measure. */
export const STRENGTH_EVIDENCE_CAP = 5;

function collectAskHits(
  measureId: 2 | 3,
  askCoding: SermonApplicationCoding[],
  sermons: SermonRef[],
): PrepStrengthExample[] {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  const out: PrepStrengthExample[] = [];
  for (const row of askCoding) {
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const ask of row.asks) {
      const hit =
        measureId === 2 ? ask.named_object : ask.named_cost;
      if (!hit) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, ask.quote);
      if (!verified) {
        continue;
      }
      out.push({
        measureId,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        kind: "quote",
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return out;
}

function collectConclusionHits(sermons: SermonRef[]): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    if (measure4ConclusionFinished(sermon.content, sermon.intakePath) !== true) {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const closing = finalTwoSentences(cleaned);
    if (!closing) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, closing);
    if (!verified) {
      continue;
    }
    out.push({
      measureId: 4,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "closing_sentences",
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return out;
}

function collectFrameHits(sermons: SermonRef[]): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    if (
      measure5OutlineHomogeneous(sermon.content, sermon.intakePath) !== true
    ) {
      continue;
    }
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const heads = outlinePoints(cleaned);
    if (heads.length < 3) {
      continue;
    }
    let firstOffset: number | null = null;
    const verifiedHeads: string[] = [];
    for (const head of heads) {
      const verified = verifyOrDrop(sermon.content, head);
      if (!verified) {
        continue;
      }
      if (firstOffset == null) {
        firstOffset = verified.offset;
      }
      verifiedHeads.push(verified.quote);
    }
    if (verifiedHeads.length < 3 || firstOffset == null) {
      continue;
    }
    out.push({
      measureId: 5,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "point_heads",
      quote: verifiedHeads.join("\n"),
      heads: verifiedHeads,
      offset: firstOffset,
    });
  }
  return out;
}

function collectReciprocalHits(sermons: SermonRef[]): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    if (!measure7HasReciprocalAsk(sermon.content)) {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const span = pickReciprocalAskSpan(cleaned);
    if (!span) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, span);
    if (!verified) {
      continue;
    }
    out.push({
      measureId: 7,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "quote",
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return out;
}

function collectNamingHits(
  namingCoding: SermonNamingCoding[],
  sermons: SermonRef[],
): PrepStrengthExample[] {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  const out: PrepStrengthExample[] = [];
  for (const row of namingCoding) {
    if (!row.noFaultNaming) {
      continue;
    }
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const naming of row.namings) {
      if (naming.valence === "fault") {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, naming.quote);
      if (!verified) {
        continue;
      }
      out.push({
        measureId: 9,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        kind: "quote",
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return out;
}

function collectAddressHits(sermons: SermonRef[]): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    const span = measure12AddressMatch(sermon.content);
    if (!span) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, span);
    if (!verified) {
      continue;
    }
    out.push({
      measureId: 12,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "quote",
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return out;
}

/**
 * Up to five verified evidence items per strength measure.
 * Missing evidence omits the slot rather than inventing text.
 * Quotes claimed here are added to `usedQuotes` for card-wide dedupe.
 */
export function selectStrengthExamples(params: {
  strengthIds: PrepMeasureId[];
  sermons: SermonRef[];
  askCoding: SermonApplicationCoding[];
  namingCoding: SermonNamingCoding[];
  usedQuotes?: Set<string>;
}): PrepStrengthExample[] {
  const usedQuotes = params.usedQuotes ?? new Set<string>();
  const out: PrepStrengthExample[] = [];
  for (const id of params.strengthIds) {
    let candidates: PrepStrengthExample[] = [];
    if (id === 2) {
      candidates = collectAskHits(2, params.askCoding, params.sermons);
    } else if (id === 3) {
      candidates = collectAskHits(3, params.askCoding, params.sermons);
    } else if (id === 4) {
      candidates = collectConclusionHits(params.sermons);
    } else if (id === 5) {
      candidates = collectFrameHits(params.sermons);
    } else if (id === 7) {
      candidates = collectReciprocalHits(params.sermons);
    } else if (id === 9) {
      candidates = collectNamingHits(params.namingCoding, params.sermons);
    } else if (id === 12) {
      candidates = collectAddressHits(params.sermons);
    }
    out.push(...pickUpTo(candidates, STRENGTH_EVIDENCE_CAP, usedQuotes));
  }
  return out;
}
