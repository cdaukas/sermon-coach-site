import type { MentorSeatType } from "@/lib/mentor/relationships";

/**
 * Monthly diagnostic-row cap per relationship.
 * Must match public.mentored_monthly_submission_limit and
 * create_mentored_evaluation.
 */
export function mentoredMonthlySubmissionLimit(
  seatType: MentorSeatType,
): number {
  return seatType === "debrief" ? 2 : 4;
}
