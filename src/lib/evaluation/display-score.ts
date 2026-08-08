/** Converts the internal weighted /55 score to the base-10 display value. Display-only. */
export function toDisplayScore(weighted55: number): number {
  return Math.round((weighted55 / 5.5) * 10) / 10;
}

/** Bare headline numeral — e.g. 7.5 */
export function formatDisplayScoreBare(weighted55: number): string {
  return toDisplayScore(weighted55).toFixed(1);
}

/** Methodology appendix headline — e.g. 7.5 / 10 */
export function formatDisplayScoreWithDenom(weighted55: number): string {
  return `${formatDisplayScoreBare(weighted55)} / 10`;
}

/**
 * Display stored score_band rows. Strict on write is band-only going forward;
 * alias on read strips historical "· Tier N" and legacy "C · Faithful" prefixes.
 * Never re-appends a tier rank.
 */
export function formatStoredScoreBandForDisplay(
  scoreBand: string | null,
  _overallScore: number | null,
): string {
  if (!scoreBand) return "View";

  let display = scoreBand.replace(/\s*·\s*Tier\s*\d+\s*/gi, "").trim();
  display = display.replace(/\s*·\s*$/, "").trim();

  const letterBand = display.match(/^[A-F]\s*·\s*(.+)$/i);
  if (letterBand?.[1]) {
    return letterBand[1].trim();
  }

  return display || "View";
}

/**
 * Cards and earlier-evals: band only. tierLabel is always null (historical
 * "· Tier N" strings are stripped; we never surface a rank).
 */
export function parseEvaluationCardLabels(
  scoreBand: string | null,
  overallScore: number | null,
): { bandLabel: string; tierLabel: string | null } {
  const bandLabel = formatStoredScoreBandForDisplay(scoreBand, overallScore);
  return { bandLabel: bandLabel || "View", tierLabel: null };
}
