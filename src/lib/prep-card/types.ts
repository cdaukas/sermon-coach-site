import type { PrepMeasureId } from "./measures";

export type PrepSourceFormat = "manuscript" | "transcript" | "mixed" | "unknown";

/** Per-measure count over the sample. null = not computed / ineligible. */
export type PrepMeasureCount = {
  id: PrepMeasureId;
  /** Sermons that hit the positive condition. */
  hits: number | null;
  /** Sermons this measure could be scored on. */
  eligible: number | null;
  /** hits/eligible when both known; null when not ranked. */
  rate: number | null;
};

export type PrepRankedMeasure = {
  id: PrepMeasureId;
  rate: number;
  hits: number;
  eligible: number;
};

export type PrepCardSelection = {
  strengths: PrepRankedMeasure[];
  focus: PrepRankedMeasure[];
};

export type PrepCardSnapshot = {
  sampleSize: number;
  generatedAt: string;
  sourceFormat: PrepSourceFormat;
  /** How many measures entered the ranking pools. */
  rankedMeasureCount: number;
  /** Plain note when the pool is not the full twelve. */
  poolNote: string;
  counts: PrepMeasureCount[];
  strengths: PrepRankedMeasure[];
  focus: PrepRankedMeasure[];
  /** Sermon ids used (for audit). */
  sermonIds: string[];
};

export type PrepCardRow = {
  id: string;
  user_id: string;
  generated_at: string;
  sample_size: number;
  source_format: PrepSourceFormat;
  ranked_measure_count: number;
  pool_note: string;
  snapshot: PrepCardSnapshot;
  created_at: string;
};
