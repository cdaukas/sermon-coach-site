import { createClient } from "@/lib/supabase/server";
import type { EvaluationStatus } from "@/lib/evaluation/types";

export type MentoredSubmissionListItem = {
  evaluationId: string;
  relationshipId: string;
  seatType: string;
  menteeId: string;
  menteeEmail: string;
  sermonId: string;
  sermonTitle: string;
  primaryPassage: string | null;
  status: EvaluationStatus;
  overallScore: number | null;
  scoreBand: string | null;
  releasedToMenteeAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): MentoredSubmissionListItem | null {
  const evaluationId = row.evaluation_id;
  const relationshipId = row.relationship_id;
  const menteeId = row.mentee_id;
  const menteeEmail = row.mentee_email;
  const sermonId = row.sermon_id;
  const sermonTitle = row.sermon_title;
  const status = row.status;
  const createdAt = row.created_at;

  if (
    typeof evaluationId !== "string" ||
    typeof relationshipId !== "string" ||
    typeof menteeId !== "string" ||
    typeof menteeEmail !== "string" ||
    typeof sermonId !== "string" ||
    typeof sermonTitle !== "string" ||
    typeof status !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }

  if (
    status !== "pending" &&
    status !== "running" &&
    status !== "complete" &&
    status !== "failed"
  ) {
    return null;
  }

  return {
    evaluationId,
    relationshipId,
    seatType: typeof row.seat_type === "string" ? row.seat_type : "",
    menteeId,
    menteeEmail,
    sermonId,
    sermonTitle,
    primaryPassage:
      typeof row.primary_passage === "string" ? row.primary_passage : null,
    status,
    overallScore:
      typeof row.overall_score === "number" ? row.overall_score : null,
    scoreBand: typeof row.score_band === "string" ? row.score_band : null,
    releasedToMenteeAt:
      typeof row.released_to_mentee_at === "string"
        ? row.released_to_mentee_at
        : null,
    completedAt:
      typeof row.completed_at === "string" ? row.completed_at : null,
    createdAt,
  };
}

/**
 * Flat list of mentored diagnostic submissions for the signed-in mentor.
 * Calls list_mentored_evaluations_for_mentor; does not query sermons tables.
 */
export async function listMentoredEvaluationsForMentor(): Promise<
  MentoredSubmissionListItem[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "list_mentored_evaluations_for_mentor",
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) =>
      row && typeof row === "object"
        ? mapRow(row as Record<string, unknown>)
        : null,
    )
    .filter((row): row is MentoredSubmissionListItem => row != null);
}
