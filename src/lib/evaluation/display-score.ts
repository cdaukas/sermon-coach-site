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

function deriveTierFromWeighted(weighted: number): number {
  if (weighted >= 47) return 5;
  if (weighted >= 39) return 4;
  if (weighted >= 30) return 3;
  if (weighted >= 22) return 2;
  return 1;
}

/** Display stored score_band rows, including legacy "C · Faithful" strings. */
export function formatStoredScoreBandForDisplay(
  scoreBand: string | null,
  overallScore: number | null,
): string {
  if (!scoreBand) return "View";
  if (scoreBand.includes("Tier ")) return scoreBand;

  const parts = scoreBand.split("·").map((part) => part.trim());
  if (parts.length === 2 && overallScore != null) {
    const [, band] = parts;
    return `${band} · Tier ${deriveTierFromWeighted(overallScore)}`;
  }

  return scoreBand;
}

export function parseEvaluationCardLabels(
  scoreBand: string | null,
  overallScore: number | null,
): { bandLabel: string; tierLabel: string | null } {
  const formatted = formatStoredScoreBandForDisplay(scoreBand, overallScore);
  const tierMatch = formatted.match(/Tier \d+/);
  const tierLabel = tierMatch?.[0] ?? null;
  const bandLabel = tierMatch
    ? formatted.slice(0, tierMatch.index).replace(/·\s*$/, "").trim()
    : formatted;

  return { bandLabel: bandLabel || "View", tierLabel };
}
