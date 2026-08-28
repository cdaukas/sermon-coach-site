import { parseMenteeReads } from "@/lib/mentor/mentee-reads";
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
};

const FALLBACK_MENTOR_NAME = "a preacher you know";

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
 * Active mentee seat plus whether he reads the debrief. Used by submit and
 * the sermon page so a dark relationship never polls a row he cannot read.
 */
export async function getMenteeCoachingView(
  userId: string,
): Promise<MenteeCoachingView> {
  const empty: MenteeCoachingView = {
    isMentoredMentee: false,
    menteeReadsNone: false,
    debriefVisibleSince: null,
    mentorName: FALLBACK_MENTOR_NAME,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentor_relationships")
    .select("id, mentor_id, mentee_reads, debrief_visible_since")
    .eq("mentee_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error || data == null) {
    return empty;
  }

  const mentorName = await mentorDisplayName(data.mentor_id as string);
  const stamp =
    typeof data.debrief_visible_since === "string"
      ? data.debrief_visible_since
      : null;

  return {
    isMentoredMentee: true,
    menteeReadsNone: parseMenteeReads(data.mentee_reads) === "none",
    debriefVisibleSince: stamp,
    mentorName,
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
    return name.length > 0 ? name : FALLBACK_MENTOR_NAME;
  } catch {
    return FALLBACK_MENTOR_NAME;
  }
}
