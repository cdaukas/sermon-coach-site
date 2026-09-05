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

/** Verified failing excerpt + rewrite for one focus measure. */
export type PrepFocusExample = {
  measureId: PrepMeasureId;
  sermonId: string;
  sermonTitle: string;
  /** Exact contiguous substring from the cleaned manuscript. */
  quote: string;
  offset: number;
  /** Model rewrite of that quote only; absent if rewrite failed. */
  rewrite: string | null;
};

export type PrepCardSelection = {
  strengths: PrepRankedMeasure[];
  focus: PrepRankedMeasure[];
};

export type PrepCardSnapshot = {
  sampleSize: number;
  generatedAt: string;
  sourceFormat: PrepSourceFormat;
  manuscriptCount: number;
  transcriptCount: number;
  /** How many measures entered the ranking pools. */
  rankedMeasureCount: number;
  /** What was ranked, with format split and per-measure support. */
  poolNote: string;
  counts: PrepMeasureCount[];
  strengths: PrepRankedMeasure[];
  focus: PrepRankedMeasure[];
  /** WAS/NOW examples for focus measures that yielded a verified quote. */
  focusExamples: PrepFocusExample[];
  /** Sermon ids used (for audit). */
  sermonIds: string[];
  /** Optional rewrite-call cost audit (one call per card when examples exist). */
  rewriteCostUsd?: number | null;
  rewriteModel?: string | null;
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
