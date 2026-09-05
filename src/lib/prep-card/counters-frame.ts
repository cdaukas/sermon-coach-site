/**
 * Measure 5: Frame-Break Test.
 * Manuscript-only. Detects a mixed-origin outline by grammatical pattern
 * mismatch across numbered / ALL-CAPS point heads.
 * Ported outline extraction from scripts/sermon_parsers.py.
 */

import { cleanSermonText, detectPrepSourceFormat } from "./text";

const OUTLINE_LINE =
  /^\s*(?:\d+[.)]\s+|[IVX]+[.)]\s+|[A-Z][A-Z \-/&']{4,}\s*$)/;
const STAGE_LABELS = new Set([
  "INTRO",
  "PRAYER",
  "SERMON",
  "ESV",
  "FCF",
  "PROP",
  "CONCLUSION",
  "APPLICATION",
  "ILLUSTRATION",
  "CLOSE",
  "AMEN",
  "WELCOME",
  "DISMISS",
  "INSERT PICTURE",
  "STORY",
  "BIG IDEA",
]);
const FOOTNOTE_BODY =
  /^(?:Greek |Or |ver\.|ch\.|See |Some manuscripts|The Holy Bible)/i;
const QUOTE_BODY = /^[.…\u2026]{0,3}\s*["\u201C\u2018'\u00AB\u2026]/;
const NUMBER_PREFIX = /^(?:\d+[.)]\s+|[IVX]+[.)]\s+)/;

const IMPERATIVE_HEAD =
  /^(?:Go|Come|Give|Take|Make|Look|Listen|Stop|Start|Pray|Serve|Love|Bear|Speak|Tell|Ask|Call|Write|Turn|Consider|Remember|Trust|Believe|Rest|Confess|Forgive|Repent|Let|Do|Don't|Be|Seek|Hold|Encourage|Welcome|Invite|Show|Bring|Know|See|Hear|Stand|Walk|Live|Put|Keep|Leave|Follow|Obey|Submit|Wait|Watch|Open|Close|Build|Fight|Run|Sit|Rise|Enter|Return)\b/;

export type HeadPattern =
  | "imperative"
  | "gerund"
  | "infinitive"
  | "question"
  | "copula"
  | "noun_phrase"
  | "other";

/** Numbered / ALL-CAPS main and sub points, not quote catalogs or labels. */
export function outlinePoints(cleaned: string): string[] {
  const out: string[] = [];
  for (const line of cleaned.split("\n")) {
    const rawLine = line.trim();
    if (!rawLine || rawLine.split(/\s+/).filter(Boolean).length > 20) {
      continue;
    }
    const label = rawLine.replace(/:$/, "");
    if (STAGE_LABELS.has(label)) {
      continue;
    }
    if (!OUTLINE_LINE.test(line)) {
      continue;
    }
    const body = rawLine.replace(NUMBER_PREFIX, "");
    if (body !== rawLine) {
      if (QUOTE_BODY.test(body) || FOOTNOTE_BODY.test(body)) {
        continue;
      }
    }
    out.push(rawLine);
  }
  return out;
}

export function stripOutlineNumber(point: string): string {
  return point.replace(NUMBER_PREFIX, "").trim();
}

/** Coarse grammatical frame for a point head. */
export function headPattern(point: string): HeadPattern {
  const body = stripOutlineNumber(point);
  if (/\?\s*$/.test(body)) {
    return "question";
  }
  if (/^To\s+\w+/i.test(body)) {
    return "infinitive";
  }
  if (/^[A-Z][a-z]+ing\b/.test(body) || /^\w+ing\b/i.test(body)) {
    return "gerund";
  }
  if (IMPERATIVE_HEAD.test(body)) {
    return "imperative";
  }
  if (/\b(?:is|are|was|were|am)\b/i.test(body)) {
    return "copula";
  }
  if (
    !/\b(?:is|are|was|were|am|have|has|had|will|shall|can|could|may|might|must|do|does|did)\b/i.test(
      body,
    )
  ) {
    return "noun_phrase";
  }
  return "other";
}

/**
 * True when one head breaks the grammatical pattern of the others.
 * Needs at least three points and a majority frame with a dissent.
 */
export function hasFrameBreak(points: readonly string[]): boolean {
  if (points.length < 3) {
    return false;
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
  if (majority == null || majorityCount < 2) {
    return false;
  }
  return patterns.some((pattern) => pattern !== majority);
}

/**
 * Measure 5 positive: outline is homogeneous (no frame-break).
 * Manuscript-only; null when there are fewer than three outline points.
 */
export function measure5OutlineHomogeneous(
  raw: string,
  intakePath?: string | null,
): boolean | null {
  const format = detectPrepSourceFormat(raw, intakePath);
  if (format !== "manuscript") {
    return null;
  }
  const cleaned = cleanSermonText(raw);
  const points = outlinePoints(cleaned);
  if (points.length < 3) {
    return null;
  }
  return !hasFrameBreak(points);
}
