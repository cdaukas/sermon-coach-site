import type { EvaluationResultStrict } from "./schema";
import type { CoachingNarrative } from "./coaching-schema";
import type { HowItPreaches } from "./hip-schema";

export type EvaluationStatus = "pending" | "running" | "complete" | "failed";

export type ReportMode = "diagnostic" | "debrief";

export type SermonEvaluationRow = {
  id: string;
  sermon_version_id: string;
  status: EvaluationStatus;
  report_mode: ReportMode;
  coaching_narrative: CoachingNarrative | null;
  how_it_preaches: HowItPreaches | null;
  error_message: string | null;
  model: string | null;
  prompt_version: string;
  result: EvaluationResultStrict | null;
  overall_score: number | null;
  score_band: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type SermonEvaluationListItem = Pick<
  SermonEvaluationRow,
  | "id"
  | "status"
  | "report_mode"
  | "overall_score"
  | "score_band"
  | "prompt_version"
  | "created_at"
  | "completed_at"
>;

/** How getEvaluationById resolved sermon metadata for this viewer. */
export type EvaluationSermonResolvedVia = "owner" | "mentored_context";

export type EvaluationWithSermon = {
  evaluation: SermonEvaluationRow;
  sermon: { id: string; title: string; primary_passage: string | null };
  /**
   * Manuscript text from the evaluation's sermon_versions row, when the
   * viewer can read that row (owner path). Null for mentored_context.
   */
  manuscriptContent: string | null;
  /** Navigation hint only. Not a permission check. */
  resolvedVia: EvaluationSermonResolvedVia;
};

export type RequestEvaluationResult =
  | {
      ok: true;
      evaluationId: string;
      sermonId: string;
      /** Mentored path only: poll and navigate to this debrief row. */
      debriefEvaluationId?: string;
    }
  | { ok: false; error: string; code?: string };
