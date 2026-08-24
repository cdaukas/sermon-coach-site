/**
 * Plot-space helpers for the growth chart. Client-safe: no schema or server imports.
 *
 * Recheck MATERIAL_PROMPT_BOUNDARIES on every prompt_version bump.
 * v3.2 → v3.3 is the only boundary that moved the mean.
 */
export const GROWTH_PLOT_FLOOR = 30;
export const GROWTH_PLOT_CEILING = 55;

export const MATERIAL_PROMPT_BOUNDARIES: ReadonlyArray<readonly [string, string]> =
  [["v3.2", "v3.3"]];

export function clampScoreToPlot(score: number): number {
  if (!Number.isFinite(score)) {
    return GROWTH_PLOT_FLOOR;
  }
  return Math.min(GROWTH_PLOT_CEILING, Math.max(GROWTH_PLOT_FLOOR, score));
}

export function isMaterialPromptBoundary(
  previousVersion: string,
  nextVersion: string,
): boolean {
  return MATERIAL_PROMPT_BOUNDARIES.some(
    ([from, to]) => previousVersion === from && nextVersion === to,
  );
}
