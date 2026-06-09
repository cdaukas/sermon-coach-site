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
