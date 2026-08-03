import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
};

type RelationshipRow = {
  id: string;
  status: string;
  seat_type: string;
  invite_token: string;
  mentee_id: string | null;
  created_at: string;
  accepted_at: string | null;
  invite_email_to: string | null;
  invite_email_sent_at: string | null;
};

function asSeatType(value: string): MentorSeatType | null {
  if (value === "debrief" || value === "evaluation") {
    return value;
  }
  return null;
}

async function resolveMenteeEmails(
  menteeIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(menteeIds.filter((id) => id.length > 0))];
  const emails = new Map<string, string>();
  if (unique.length === 0) {
    return emails;
  }

  try {
    const admin = createAdminClient();
    await Promise.all(
      unique.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error || !data.user?.email) {
          return;
        }
        const email = data.user.email.trim();
        if (email.length > 0) {
          emails.set(id, email);
        }
      }),
    );
  } catch {
    // Service role absent in some local envs; leave emails null.
  }

  return emails;
}

/**
 * Pending and active seats for the signed-in mentor.
 * Uses mentor SELECT under RLS; no list RPC.
 * Active mentee emails come from auth admin (auth.users is not client-readable).
 */
export async function listMentorSeatsForMentor(): Promise<{
  pending: PendingMentorInvite[];
  active: ActiveMentorMentee[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentor_relationships")
    .select(
      "id, status, seat_type, invite_token, mentee_id, created_at, accepted_at, invite_email_to, invite_email_sent_at",
    )
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RelationshipRow[];
  const pending: PendingMentorInvite[] = [];
  const activeCandidates: Array<Omit<ActiveMentorMentee, "menteeEmail"> & {
    menteeId: string;
  }> = [];

  for (const row of rows) {
    const seatType = asSeatType(row.seat_type);
    if (!seatType) {
      continue;
    }

    if (row.status === "pending") {
      pending.push({
        relationshipId: row.id,
        seatType,
        inviteToken: row.invite_token,
        createdAt: row.created_at,
        inviteEmailTo:
          typeof row.invite_email_to === "string" &&
          row.invite_email_to.trim() !== ""
            ? row.invite_email_to.trim()
            : null,
        inviteEmailSentAt:
          typeof row.invite_email_sent_at === "string"
            ? row.invite_email_sent_at
            : null,
      });
      continue;
    }

    if (row.status === "active" && row.mentee_id) {
      activeCandidates.push({
        relationshipId: row.id,
        seatType,
        menteeId: row.mentee_id,
        acceptedAt:
          typeof row.accepted_at === "string" ? row.accepted_at : null,
      });
    }
  }

  const emails = await resolveMenteeEmails(
    activeCandidates.map((row) => row.menteeId),
  );

  const active: ActiveMentorMentee[] = activeCandidates.map((row) => ({
    ...row,
    menteeEmail: emails.get(row.menteeId) ?? null,
  }));

  return { pending, active };
}

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
