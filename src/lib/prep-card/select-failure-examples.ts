/**
 * Select one verified failing excerpt per focus measure for WAS/NOW.
 * Quotes that do not exact-match cleaned text are dropped, not repaired.
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
import {
  cleanSermonText,
  detectPrepSourceFormat,
  sermonParagraphs,
} from "./text";

export type PrepFailureExample = {
  measureId: PrepMeasureId;
  sermonId: string;
  sermonTitle: string;
  quote: string;
  /** Offset into cleaned manuscript; stored for audit. */
  offset: number;
};

type SermonRef = {
  id: string;
  title: string;
  content: string;
  intakePath?: string | null;
};

const RECIPROCAL =
  /\b(one another|each other|the body|your brother|your sister|someone in (?:the|this) church|fellow (?:believer|member)s?|the person next to you)\b/i;

const IMPERATIVE_START =
  /(?:^|[.!?]\s+|\n)\s*((?:Go|Come|Give|Take|Make|Look|Listen|Stop|Start|Pray|Serve|Love|Bear|Speak|Tell|Ask|Call|Write|Turn|Consider|Remember|Trust|Believe|Rest|Confess|Forgive|Repent|Let|Do|Don't|Be|Seek|Hold|Encourage|Welcome|Invite|Show|Bring)\b[^.!?\n]{0,100})/g;

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
): PrepFailureExample | null {
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
      return {
        measureId,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
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

function pickFrameBreakFailure(sermons: SermonRef[]): PrepFailureExample | null {
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
    return {
      measureId: 5,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
    };
  }
  return null;
}

function pickConclusionFailure(sermons: SermonRef[]): PrepFailureExample | null {
  for (const sermon of sermons) {
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    if (terminalResidue(cleaned) === 0) {
      continue;
    }
    const paras = sermonParagraphs(cleaned);
    const candidate = [...paras]
      .reverse()
      .find((p) => p.trim().length >= 12 && p.trim().length <= 280);
    if (!candidate) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, candidate.trim());
    if (!verified) {
      continue;
    }
    return {
      measureId: 4,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
    };
  }
  return null;
}

function pickNonReciprocalAsk(sermons: SermonRef[]): PrepFailureExample | null {
  for (const sermon of sermons) {
    const cleaned = cleanSermonText(sermon.content);
    const re = new RegExp(IMPERATIVE_START.source, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(cleaned)) !== null) {
      const span = (match[1] ?? "").trim();
      if (span.length < 8) {
        continue;
      }
      const window = cleaned.slice(match.index, match.index + 110);
      if (RECIPROCAL.test(window)) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, span);
      if (!verified) {
        continue;
      }
      return {
        measureId: 7,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
      };
    }
  }
  return null;
}

/**
 * One failure example per focus measure id, when a verified excerpt exists.
 * Missing measures simply omit WAS/NOW rather than inventing text.
 */
export function selectFocusFailureExamples(params: {
  focusIds: PrepMeasureId[];
  sermons: SermonRef[];
  askCoding: SermonApplicationCoding[];
}): PrepFailureExample[] {
  const out: PrepFailureExample[] = [];
  for (const id of params.focusIds) {
    let example: PrepFailureExample | null = null;
    if (id === 2) {
      example = pickAskFailure(2, params.askCoding, params.sermons);
    } else if (id === 3) {
      example = pickAskFailure(3, params.askCoding, params.sermons);
    } else if (id === 4) {
      example = pickConclusionFailure(params.sermons);
    } else if (id === 5) {
      example = pickFrameBreakFailure(params.sermons);
    } else if (id === 7) {
      example = pickNonReciprocalAsk(params.sermons);
    }
    if (example) {
      out.push(example);
    }
  }
  return out;
}
