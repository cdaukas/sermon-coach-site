export type MentorSeatType = "debrief" | "evaluation";

export type PendingMentorInvite = {
  relationshipId: string;
  seatType: MentorSeatType;
  inviteToken: string;
  createdAt: string;
  inviteEmailTo: string | null;
  inviteEmailSentAt: string | null;
};

export type ActiveMentorMentee = {
  relationshipId: string;
  seatType: MentorSeatType;
  menteeId: string;
  menteeEmail: string | null;
  acceptedAt: string | null;
  /** Diagnostic submissions this calendar month vs seat allotment. */
  submissionsUsed: number;
  submissionsLimit: number;
};

export type EndMentorRelationshipResult =
  | {
      ok: true;
      error_code: null;
      relationship_id: string;
      ended_at: string;
      released_count: number;
    }
  | {
      ok: false;
      error_code: string;
    };

export type RevokeMentorInviteResult =
  | {
      ok: true;
      error_code: null;
      relationship_id: string;
      ended_at: string;
    }
  | {
      ok: false;
      error_code: string;
    };

const END_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Sign in to end mentoring.",
  not_found: "That mentoring relationship could not be found.",
  not_a_party: "You are not part of that mentoring relationship.",
  not_active: "That mentoring relationship is not active.",
};

const REVOKE_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Sign in to revoke an invitation.",
  not_found: "That invitation could not be found.",
  not_your_invite: "You can only revoke your own invitations.",
  not_pending: "That invitation is no longer pending.",
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function endMentorRelationshipErrorMessage(
  errorCode: string | null | undefined,
): string {
  if (errorCode && errorCode in END_ERROR_MESSAGES) {
    return END_ERROR_MESSAGES[errorCode];
  }
  return GENERIC_ERROR;
}

export function revokeMentorInviteErrorMessage(
  errorCode: string | null | undefined,
): string {
  if (errorCode && errorCode in REVOKE_ERROR_MESSAGES) {
    return REVOKE_ERROR_MESSAGES[errorCode];
  }
  return GENERIC_ERROR;
}
