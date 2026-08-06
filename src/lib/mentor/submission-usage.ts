import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentoredMonthlySubmissionLimit } from "@/lib/mentor/allotment";
import { createClient } from "@/lib/supabase/server";

export type MentoredSubmissionUsage = {
  used: number;
  limit: number;
};

/**
 * Diagnostic rows this calendar month for a relationship — same filter as
 * create_mentored_evaluation allotment check.
 */
export async function countMentoredSubmissionsThisMonth(
  relationshipIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (relationshipIds.length === 0) {
    return counts;
  }

  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select("mentor_relationship_id")
    .in("mentor_relationship_id", relationshipIds)
    .eq("report_mode", "diagnostic")
    .gte("created_at", monthStart.toISOString());

  if (error || !data) {
    return counts;
  }

  for (const row of data) {
    const id = row.mentor_relationship_id;
    if (typeof id !== "string") {
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

export function submissionUsageForSeat(
  seatType: MentorSeatType,
  used: number,
): MentoredSubmissionUsage {
  return {
    used,
    limit: mentoredMonthlySubmissionLimit(seatType),
  };
}
