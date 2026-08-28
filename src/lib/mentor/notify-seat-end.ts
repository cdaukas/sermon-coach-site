import { sendSeatEndEmail } from "@/lib/email/send-seat-end-email";
import {
  menteeGreetingFromDisplayName,
  menteeIsActiveCoach,
  mentorNameFromDisplayName,
} from "@/lib/email/seat-end-email-template";
import { createAdminClient } from "@/lib/supabase/admin";

const LOG_PREFIX = "[seat-end-email]";

type RelationshipRow = {
  id: string;
  status: string;
  mentor_id: string;
  mentee_id: string | null;
  seat_end_email_sent_at: string | null;
};

type ProfileRow = {
  display_name: string | null;
  subscription_status?: string | null;
  plan_tier?: string | null;
};

export function shouldSendSeatEndEmail(row: {
  status: string;
  mentee_id: string | null;
  seat_end_email_sent_at: string | null;
}): boolean {
  return (
    row.status === "ended" &&
    typeof row.mentee_id === "string" &&
    row.mentee_id.length > 0 &&
    row.seat_end_email_sent_at == null
  );
}

function readResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

/**
 * Notify the mentee that a seat ended. Never throws: a lost email is
 * recoverable, a failed close is not. Callers must invoke this after the
 * relationship is already ended.
 */
export async function notifyMenteeSeatEnded(
  relationshipId: string,
): Promise<void> {
  try {
    await sendSeatEndEmailForEndedRelationship(relationshipId);
  } catch (error) {
    console.error(`${LOG_PREFIX} send failed; termination stands`, {
      relationshipId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyMenteesSeatsEnded(
  relationshipIds: string[],
): Promise<void> {
  for (const id of relationshipIds) {
    await notifyMenteeSeatEnded(id);
  }
}

async function sendSeatEndEmailForEndedRelationship(
  relationshipId: string,
): Promise<void> {
  const apiKey = readResendApiKey();
  if (!apiKey) {
    console.error(`${LOG_PREFIX} RESEND_API_KEY missing or empty`, {
      relationshipId,
    });
    return;
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error(`${LOG_PREFIX} admin client unavailable`, {
      relationshipId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const { data: relationship, error: relError } = await admin
    .from("mentor_relationships")
    .select("id, status, mentor_id, mentee_id, seat_end_email_sent_at")
    .eq("id", relationshipId)
    .maybeSingle();

  if (relError) {
    console.error(`${LOG_PREFIX} relationship lookup failed`, {
      relationshipId,
      error: relError.message,
    });
    return;
  }

  const row = relationship as RelationshipRow | null;
  if (!row || !shouldSendSeatEndEmail(row)) {
    return;
  }

  const menteeId = row.mentee_id as string;

  const [mentorLookup, menteeLookup] = await Promise.all([
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", row.mentor_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("display_name, subscription_status, plan_tier")
      .eq("id", menteeId)
      .maybeSingle(),
  ]);
  const { data: mentorProfile, error: mentorError } = mentorLookup;
  const { data: menteeProfile, error: menteeError } = menteeLookup;

  if (mentorError) {
    console.error(`${LOG_PREFIX} mentor profile lookup failed`, {
      relationshipId,
      error: mentorError.message,
    });
    return;
  }
  if (menteeError) {
    console.error(`${LOG_PREFIX} mentee profile lookup failed`, {
      relationshipId,
      error: menteeError.message,
    });
    return;
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(menteeId);

  if (userError || !userData.user?.email) {
    console.error(`${LOG_PREFIX} could not resolve mentee email`, {
      relationshipId,
      error: userError?.message ?? "email missing",
    });
    return;
  }

  const mentorName = mentorNameFromDisplayName(
    (mentorProfile as ProfileRow | null)?.display_name,
  );
  const menteeGreeting = menteeGreetingFromDisplayName(
    (menteeProfile as ProfileRow | null)?.display_name,
  );
  const includeCoachPitch = !menteeIsActiveCoach(
    (menteeProfile as ProfileRow | null)?.subscription_status,
    (menteeProfile as ProfileRow | null)?.plan_tier,
  );

  const sendResult = await sendSeatEndEmail({
    apiKey,
    to: userData.user.email,
    menteeGreeting,
    mentorName,
    includeCoachPitch,
  });

  if (!sendResult.ok) {
    console.error(`${LOG_PREFIX} Resend send failed`, {
      relationshipId,
      error: sendResult.error,
    });
    return;
  }

  const { data: stamped, error: stampError } = await admin
    .from("mentor_relationships")
    .update({ seat_end_email_sent_at: new Date().toISOString() })
    .eq("id", relationshipId)
    .is("seat_end_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (stampError) {
    console.error(`${LOG_PREFIX} stamp failed after successful send`, {
      relationshipId,
      resend_id: sendResult.id,
      error: stampError.message,
    });
    return;
  }

  if (!stamped) {
    console.error(`${LOG_PREFIX} stamp skipped; already set after send`, {
      relationshipId,
      resend_id: sendResult.id,
    });
  }
}
