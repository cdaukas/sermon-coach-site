/**
 * Measure 4 (conclusion finish via TRD) and measure 7 (RI).
 * Ported from scripts/sermon_parsers.py.
 */

import {
  cleanSermonText,
  detectPrepSourceFormat,
  scriptureParagraphFlags,
  sermonParagraphs,
} from "./text";

const PLACEHOLDER =
  /\b(Ills?|XXXX|STORY OF|ADD|PREACH GOSPEL|ILLUSTRATION|NEW PROP|TBD)\b/;
const CAPS_LABEL = /^\s*[A-Z][A-Z \-/&']{2,}:\s*$/m;

/** Terminal Residue Detector. Higher = less finished conclusion. */
export function terminalResidue(cleaned: string): number {
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 0;
  }
  const tail = words.slice(Math.floor(words.length * 0.85)).join(" ");
  let score = 0;
  const tailParas = sermonParagraphs(tail);

  const bare = tailParas.filter(
    (p) => p.split(/\s+/).filter(Boolean).length <= 10 && !/[.!?]\s*$/.test(p),
  );
  if (bare.length >= 2) {
    score += 1;
  }
  if ((tail.match(CAPS_LABEL) ?? []).length >= 2) {
    score += 1;
  }
  if (tailParas.length > 0 && !/[.!?]['"]?\s*$/.test(tailParas[tailParas.length - 1]!)) {
    score += 1;
  }
  if (PLACEHOLDER.test(tail)) {
    score += 1;
  }
  if (
    tailParas.length > 0 &&
    tailParas[tailParas.length - 1]!.split(/\s+/).filter(Boolean).length <= 6
  ) {
    score += 1;
  }
  return score;
}

/** Prose ratio of the last six non-scripture paragraphs. */
export function lastSixProseRatio(
  cleaned: string,
  scriptFlags: boolean[],
): number {
  const paras = sermonParagraphs(cleaned);
  const keep = paras.filter(
    (_p, i) => i >= scriptFlags.length || !scriptFlags[i],
  );
  const last = keep.slice(-6);
  if (last.length === 0) {
    return 0;
  }
  const prose = last.filter(
    (p) => p.split(/\s+/).filter(Boolean).length > 10 && /[.!?]['"]?\s*$/.test(p),
  );
  return prose.length / last.length;
}

/**
 * Measure 4 positive: conclusion finished (no terminal residue).
 * Manuscript-only; transcripts return null.
 */
export function measure4ConclusionFinished(
  raw: string,
  intakePath?: string | null,
): boolean | null {
  const format = detectPrepSourceFormat(raw, intakePath);
  if (format !== "manuscript") {
    return null;
  }
  const cleaned = cleanSermonText(raw);
  return terminalResidue(cleaned) === 0;
}

const RECIPROCAL =
  /\b(one another|each other|the body|your brother|your sister|someone in (?:the|this) church|fellow (?:believer|member)s?|the person next to you)\b/i;

const IMPERATIVE_START =
  /(?:^|[.!?]\s+|\n)\s*((?:Go|Come|Give|Take|Make|Look|Listen|Stop|Start|Pray|Serve|Love|Bear|Speak|Tell|Ask|Call|Write|Turn|Consider|Remember|Trust|Believe|Rest|Confess|Forgive|Repent|Let|Do|Don't|Be|Seek|Hold|Encourage|Welcome|Invite|Show|Bring)\b)/g;

/** Reciprocal-object hits near imperatives. */
export function reciprocalImperativeHits(cleaned: string): number {
  let hits = 0;
  const re = new RegExp(IMPERATIVE_START.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    const window = cleaned.slice(match.index, match.index + 110);
    if (RECIPROCAL.test(window)) {
      hits += 1;
    }
  }
  return hits;
}

/** Measure 7 positive: at least one reciprocal ask. */
export function measure7HasReciprocalAsk(raw: string): boolean {
  const cleaned = cleanSermonText(raw);
  return reciprocalImperativeHits(cleaned) >= 1;
}

export function measure4Detail(raw: string, intakePath?: string | null) {
  const format = detectPrepSourceFormat(raw, intakePath);
  if (format !== "manuscript") {
    return { format, trd: null as number | null, l6: null as number | null, finished: null as boolean | null };
  }
  const cleaned = cleanSermonText(raw);
  const flags = scriptureParagraphFlags(raw);
  const trd = terminalResidue(cleaned);
  const l6 = lastSixProseRatio(cleaned, flags);
  return { format, trd, l6, finished: trd === 0 };
}
