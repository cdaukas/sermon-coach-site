import type { MenteeReads } from "@/lib/mentor/mentee-reads";
import type { MentoredSubmissionListItem } from "@/lib/mentor/submissions";
import type {
  ActiveMentorMentee,
  MentorSeatType,
} from "@/lib/mentor/relationships";

/**
 * One preacher, with their submissions attached.
 *
 * The mentoring page shows a person first and their sermons underneath, rather
 * than two parallel lists the mentor has to reconcile by eye. Relationship id
 * is the join key: both `list_mentor_seats_for_mentor` and
 * `list_mentored_evaluations_for_mentor` carry it.
 */
export type PreacherCard = {
  relationshipId: string;
  seatType: MentorSeatType;
  menteeEmail: string | null;
  mentorLabel: string | null;
  menteeReads: MenteeReads;
  acceptedAt: string | null;
  submissionsUsed: number;
  submissionsLimit: number;
  /** Newest first. */
  submissions: MentoredSubmissionListItem[];
};

/** Groups submissions onto their preacher. Pure; no ordering assumptions. */
export function buildPreacherCards(
  mentees: ActiveMentorMentee[],
  submissions: MentoredSubmissionListItem[],
): PreacherCard[] {
  const byRelationship = new Map<string, MentoredSubmissionListItem[]>();

  for (const submission of submissions) {
    const bucket = byRelationship.get(submission.relationshipId);
    if (bucket) {
      bucket.push(submission);
    } else {
      byRelationship.set(submission.relationshipId, [submission]);
    }
  }

  for (const bucket of byRelationship.values()) {
    bucket.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }

  return mentees.map((mentee) => ({
    relationshipId: mentee.relationshipId,
    seatType: mentee.seatType,
    menteeEmail: mentee.menteeEmail,
    mentorLabel: mentee.mentorLabel,
    menteeReads: mentee.menteeReads,
    acceptedAt: mentee.acceptedAt,
    submissionsUsed: mentee.submissionsUsed,
    submissionsLimit: mentee.submissionsLimit,
    submissions: byRelationship.get(mentee.relationshipId) ?? [],
  }));
}
