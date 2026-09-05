/**
 * Landing-zone slice for application coding (measures 2 and 3).
 * Ported from scripts/application_deep_dive.py.
 */

import { cleanSermonText } from "./text";

const HEADING_LABELED = /\b(?:CLOSING[ \t]+)?APPLICATION[ \t]*:/gi;
const HEADING_LINE = /^[ \t]*(?:CLOSING[ \t]+)?APPLICATION[ \t]*$/gim;
const SENTENCE_END = /[.!?]+["'”’)]*\s+/g;
const SENTENCE_END_PREFIX = /[.!?]+["'”’)]*\s+$/;

const FALLBACK_MIN = 1500;
const FALLBACK_MAX = 4500;

function headingStart(cleaned: string): number | null {
  HEADING_LABELED.lastIndex = 0;
  HEADING_LINE.lastIndex = 0;
  const labeled = HEADING_LABELED.exec(cleaned);
  const line = HEADING_LINE.exec(cleaned);
  const starts: number[] = [];
  if (labeled) {
    starts.push(labeled.index);
  }
  if (line) {
    starts.push(line.index);
  }
  if (starts.length === 0) {
    return null;
  }
  return Math.min(...starts);
}

function isSentenceStart(text: string, index: number): boolean {
  if (index <= 0 || index >= text.length) {
    return true;
  }
  return SENTENCE_END_PREFIX.test(text.slice(0, index));
}

export function snapForward(text: string, index: number): number {
  if (index <= 0) {
    return 0;
  }
  if (index >= text.length) {
    return text.length;
  }
  if (isSentenceStart(text, index)) {
    return index;
  }
  SENTENCE_END.lastIndex = index;
  const match = SENTENCE_END.exec(text);
  if (!match) {
    return index;
  }
  return match.index + match[0].length;
}

export type LandingZone = {
  text: string;
  source: "heading" | "fallback";
  start: number;
  end: number;
  length: number;
};

export function landingZone(raw: string): LandingZone {
  const cleaned = cleanSermonText(raw);
  const n = cleaned.length;
  const headingAt = headingStart(cleaned);
  let start: number;
  let source: "heading" | "fallback";

  if (headingAt != null) {
    start = headingAt;
    source = "heading";
  } else {
    source = "fallback";
    start = n ? Math.floor(n * 0.8) : 0;
    const window = n - start;
    if (n < FALLBACK_MIN) {
      start = 0;
    } else if (window < FALLBACK_MIN) {
      start = Math.max(0, n - FALLBACK_MIN);
    } else if (window > FALLBACK_MAX) {
      start = n - FALLBACK_MAX;
    }
    start = snapForward(cleaned, start);
  }

  const text = cleaned.slice(start);
  return {
    text,
    source,
    start,
    end: n,
    length: text.length,
  };
}

export function foldTypography(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");
}

export function verifyQuoteInText(
  cleaned: string,
  quote: string,
  zoneStart?: number,
  zoneEnd?: number,
): number | null {
  const foldedHay = foldTypography(cleaned);
  const foldedNeedle = foldTypography(quote);
  const from = zoneStart ?? 0;
  const to = zoneEnd ?? foldedHay.length;
  const slice = foldedHay.slice(from, to);
  const at = slice.indexOf(foldedNeedle);
  if (at < 0) {
    return null;
  }
  return from + at;
}
