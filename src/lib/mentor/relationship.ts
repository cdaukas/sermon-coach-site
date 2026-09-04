import {
  FALLBACK_MENTOR_NAME,
  menteeFacingMentorName,
  parseMenteeReads,
} from "@/lib/mentor/mentee-reads";
import { mentoredMonthlySubmissionLimit } from "@/lib/mentor/allotment";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type MenteeCoachingView = {
  isMentoredMentee: boolean;
  /** Live column is still none. New submits skip the poller. */
  menteeReadsNone: boolean;
  /**
   * When the mentee started seeing the debrief on new submissions.
   * Null on never-dark and still-dark rows.
   */
  debriefVisibleSince: string | null;
  /** Mentor's display name for handoff copy. */
  mentorName: string;
  /** Active relationship id when mentored; null otherwise. */
  relationshipId: string | null;
  seatType: MentorSeatType | null;
  /**
   * Calendar-month diagnostic submissions used. Null when unknown,
   * unauthorized, or the counter RPC fails — never invent a zero.
   */
  used: number | null;
  /** Monthly allotment for seatType. Null when seatType is unknown. */
  cap: number | null;
};

export { FALLBACK_MENTOR_NAME, menteeFacingMentorName } from "@/lib/mentor/mentee-reads";

function asSeatType(value: unknown): MentorSeatType | null {
  if (value === "debrief" || value === "evaluation") {
    return value;
  }
  return null;
}

function asNonNegInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) {
      return Math.floor(n);
    }
  }
  return null;
}

/**
 * True when the signed-in user is the mentee on an ACTIVE mentor relationship.
 * On select error, returns false so the UI fails toward the normal Coach view.
 */
export async function viewerHasActiveMentorRelationship(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentor_relationships")
    .select("id")
    .eq("mentee_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return false;
  }

  return data != null;
}

/**
 * Active mentee seat plus whether they read the debrief. Used by submit and
 * the sermon page so a dark relationship never polls a row they cannot read.
 */
export async function getMenteeCoachingView(
  userId: string,
): Promise<MenteeCoachingView> {
  const empty: MenteeCoachingView = {
    isMentoredMentee: false,
    menteeReadsNone: false,
    debriefVisibleSince: null,
    mentorName: FALLBACK_MENTOR_NAME,
    relationshipId: null,
    seatType: null,
    used: null,
    cap: null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentor_relationships")
    .select("id, mentor_id, seat_type, mentee_reads, debrief_visible_since")
    .eq("mentee_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error || data == null) {
    return empty;
  }

  const relationshipId =
    typeof data.id === "string" && data.id.length > 0 ? data.id : null;
  const seatType = asSeatType(data.seat_type);
  const cap =
    seatType != null ? mentoredMonthlySubmissionLimit(seatType) : null;

  let used: number | null = null;
  if (relationshipId != null) {
    const { data: usedRaw, error: usedError } = await supabase.rpc(
      "mentored_submissions_this_month",
      { p_relationship_id: relationshipId },
    );
    if (!usedError) {
      used = asNonNegInt(usedRaw);
    }
  }

  const mentorName = menteeFacingMentorName(
    await mentorDisplayName(data.mentor_id as string),
  );
  const stamp =
    typeof data.debrief_visible_since === "string"
      ? data.debrief_visible_since
      : null;

  return {
    isMentoredMentee: true,
    menteeReadsNone: parseMenteeReads(data.mentee_reads) === "none",
    debriefVisibleSince: stamp,
    mentorName,
    relationshipId,
    seatType,
    used,
    cap,
  };
}

/**
 * True when this sermon has a mentored evaluation still hidden by dark or
 * by debrief_visible_since. Bypasses mentee SELECT so a flipped
 * relationship does not render an old sermon as empty.
 */
export async function menteeSermonShowsHandoff(
  sermonId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mentee_sermon_is_dark_handoff", {
    p_sermon_id: sermonId,
  });

  if (error) {
    return false;
  }

  return data === true;
}

async function mentorDisplayName(mentorId: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", mentorId)
      .maybeSingle();
    const name =
      typeof data?.display_name === "string" ? data.display_name.trim() : "";
    return menteeFacingMentorName(name);
  } catch {
    return FALLBACK_MENTOR_NAME;
  }
}
