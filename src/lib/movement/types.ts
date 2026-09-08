import type { PrepMeasureId } from "@/lib/prep-card/measures";
import type { MovementThemeId } from "./themes";
import type { MovementVerdict } from "./verdict";

export type MovementCount = {
  measureId: PrepMeasureId;
  hits: number;
  eligible: number;
};

export type MovementQuote = {
  sermonId: string;
  sermonTitle: string;
  quote: string;
  offset: number;
};

export type MovementDisciplineRow = {
  measureId: PrepMeasureId;
  /** Short table label. */
  label: string;
  baseline: MovementCount;
  comparison: MovementCount;
  verdict: MovementVerdict;
};

/** Locked at diagnostic / prep-card generation. */
export type MovementBaseline = {
  id: string;
  userId: string;
  themeId: MovementThemeId;
  /** The three work disciplines, in focus order. */
  focusMeasureIds: PrepMeasureId[];
  baselineCounts: MovementCount[];
  sermonIds: string[];
  /** Optional human range label, e.g. "June through August". */
  sampleLabel: string | null;
  generatedAt: string;
  prepCardId: string | null;
};

export type MovementReportSnapshot = {
  themeId: MovementThemeId;
  baselineId: string;
  generatedAt: string;
  /** Face copy: "Your first 24… against the 13…" */
  sampleFace: string;
  baselineSampleSize: number;
  comparisonSampleSize: number;
  comparisonSermonIds: string[];
  /** The three focus disciplines, verdicts first. */
  disciplines: MovementDisciplineRow[];
  /**
   * Other theme measures not among the three. Reported briefly;
   * never credited as success.
   */
  unworked: MovementDisciplineRow[];
  /** Moved disciplines with before/after quotes. Empty when none moved. */
  movedDetails: Array<{
    measureId: PrepMeasureId;
    label: string;
    baseline: MovementCount;
    comparison: MovementCount;
    was: MovementQuote | null;
    now: MovementQuote | null;
    paragraph: string;
  }>;
  heldDetails: Array<{
    measureId: PrepMeasureId;
    label: string;
    baseline: MovementCount;
    comparison: MovementCount;
    paragraph: string;
    tryNext: string;
  }>;
  slippedDetails: Array<{
    measureId: PrepMeasureId;
    label: string;
    baseline: MovementCount;
    comparison: MovementCount;
    paragraph: string;
  }>;
  /** Offer same theme again when fewer than two moved. */
  offerSameTheme: boolean;
  methodNote: string;
  standingBlock: string;
  rewriteCostUsd?: number | null;
};

export const MOVEMENT_MIN_NEW_SERMONS = 8;

export const MOVEMENT_STANDING_BLOCK =
  "These are counts from your own sermons. They cannot tell you whether a sermon was faithful, whether anyone obeyed, or whether God used it. They tell you what you did more of and less of.";

export const MOVEMENT_METHOD_NOTE =
  "Moved means the rate changed by at least a third of the baseline rate and by at least three sermons in absolute terms — both, not either. Those thresholds are provisional, set by eye until a norms run is possible.";
