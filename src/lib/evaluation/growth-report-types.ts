/** Client-safe growth report types — no server or schema imports. */

export type RecentCompleteEvaluationItem = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  primaryPassage: string | null;
  completedAt: string;
  createdAt: string;
  scoreBand: string;
};

export type TrendArcEvaluationItem = {
  evaluationId: string;
  sermonTitle: string;
  completedAt: string;
  createdAt: string;
  compositeWeighted: number;
  /** Scoring instrument that produced this point; used to mark version boundaries. */
  promptVersion: string;
};

export type GrowthReportCriterionDelta = {
  id: number;
  name: string;
  category: number;
  score_a: number;
  score_b: number;
  delta: number;
  is_double_weighted: boolean;
};

export type GrowthReportHeadlines = {
  composite_weighted_a: number;
  composite_weighted_b: number;
  composite_weighted_delta: number;
  display_score_a: string;
  display_score_b: string;
  band_a: string;
  band_b: string;
  /**
   * True when baseline and current were scored under different prompt versions.
   * Numeric deltas are not a measure of preaching when this is true.
   */
  spans_rubric_boundary: boolean;
};

export type QuotePairState = "pair" | "baseline_only" | "current_only";

export type QuotePair = {
  criterionId: number;
  criterionName: string;
  delta: number;
  isDoubleWeighted: boolean;
  baselineQuote: string | null;
  currentQuote: string | null;
  pairState: QuotePairState;
};

export type GrowthReportSermonSummary = {
  sermonTitle: string;
  completedAt: string;
};

export type GrowthReportCategorySection = {
  id: string;
  number: number;
  name: string;
};

/** Serializable props for the growth report presentation layer. */
export type GrowthReportPresentation = {
  baseline: GrowthReportSermonSummary;
  current: GrowthReportSermonSummary;
  categories: GrowthReportCategorySection[];
  criterionDeltas: GrowthReportCriterionDelta[];
  headlines: GrowthReportHeadlines;
  quotePairs: QuotePair[];
  /** Same as headlines.spans_rubric_boundary; convenience for view layer. */
  spansRubricBoundary: boolean;
};

/** Pastor-facing strings for rubric-version discontinuity (approved copy). */
export const GROWTH_RUBRIC_BOUNDARY_MARKER_LABEL = "Rubric updated";

export const GROWTH_RUBRIC_BOUNDARY_PAIR_DELTA_MESSAGE =
  "The rubric changed between these two sermons, so the difference between the scores is not a measure of your preaching. Both scores are still shown.";

export const GROWTH_RUBRIC_BOUNDARY_CRITERION_MESSAGE =
  "Not comparable across a rubric change.";
