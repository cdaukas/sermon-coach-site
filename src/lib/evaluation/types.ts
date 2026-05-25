import type { EvaluationResult } from "./schema";

export type EvaluationStatus = "pending" | "running" | "complete" | "failed";

export type SermonEvaluationRow = {
  id: string;
  sermon_version_id: string;
  status: EvaluationStatus;
  error_message: string | null;
  model: string | null;
  prompt_version: string;
  result: EvaluationResult | null;
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
  | "overall_score"
  | "score_band"
  | "prompt_version"
  | "created_at"
  | "completed_at"
>;

export type EvaluationWithSermon = {
  evaluation: SermonEvaluationRow;
  sermon: { id: string; title: string };
};

export type RequestEvaluationResult =
  | { ok: true; evaluationId: string; sermonId: string }
  | { ok: false; error: string };
