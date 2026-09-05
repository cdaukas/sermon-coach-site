/**
 * Measure 12: non-Christian address.
 * Lexical detector for sermons that address someone outside the faith.
 * Smaller of 9 vs 12 (9 needs named-person valence coding).
 */

import { cleanSermonText } from "./text";

const NON_CHRISTIAN_ADDRESS = [
  /\bif you(?:'re| are)(?:\s+here)?(?:\s+and)?(?:\s+(?:do not|don't))\s+(?:yet\s+)?(?:believe|know(?:\s+(?:Christ|Jesus|him))?)/i,
  /\bif you(?:'ve| have)\s+never\s+(?:trusted|believed|accepted|come\s+to)\b/i,
  /\bif you\s+are\s+not\s+(?:yet\s+)?(?:a\s+)?(?:Christian|believer|follower)\b/i,
  /\bwhether you(?:'re| are)\s+(?:a\s+)?(?:Christian|believer)\b/i,
  /\b(?:for\s+)?(?:those|anyone|someone|the\s+person)\s+who\s+(?:do(?:es)?\s+not|don't|doesn't)\s+(?:yet\s+)?(?:believe|know(?:\s+(?:Christ|Jesus))?)/i,
  /\bif you\s+do\s+not\s+(?:yet\s+)?know\s+(?:Christ|Jesus|him)\b/i,
  /\b(?:guest|visitor)s?\s+who\s+(?:are\s+)?not\s+(?:yet\s+)?(?:Christians?|believers?)\b/i,
  /\b(?:non[- ]Christian|unbeliever|not[- ]yet[- ]believ)/i,
  /\bif you(?:'re| are)\s+(?:still\s+)?(?:seeking|searching|exploring)\b/i,
  /\bwhether or not you\s+(?:believe|are\s+a\s+Christian)\b/i,
  /\bif you(?:'re| are)\s+(?:here\s+)?(?:today\s+)?and\s+(?:you\s+)?(?:don't|do not)\s+believe\b/i,
  /\bto\s+(?:the\s+)?(?:person|one)\s+who\s+(?:does not|doesn't)\s+(?:yet\s+)?believe\b/i,
];

/** Measure 12 positive: sermon addresses someone outside the faith. */
export function measure12AddressesNonChristian(raw: string): boolean {
  return measure12AddressMatch(raw) != null;
}

/**
 * First matching non-Christian address span, for strength evidence.
 * Returns the raw match text from the cleaned manuscript.
 */
export function measure12AddressMatch(raw: string): string | null {
  const cleaned = cleanSermonText(raw);
  for (const re of NON_CHRISTIAN_ADDRESS) {
    const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
    const global = new RegExp(re.source, flags);
    const match = global.exec(cleaned);
    if (match?.[0]) {
      return match[0];
    }
  }
  return null;
}
