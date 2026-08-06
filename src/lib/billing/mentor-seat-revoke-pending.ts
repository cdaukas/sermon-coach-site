import type { SupabaseClient } from "@supabase/supabase-js";

export type MentorSeatCapacityType = "debrief" | "evaluation";

/**
 * After purchased seat quantity is written, revoke excess pending invites of
 * that seat type so cancel cannot leave open tokens that accept against zero
 * capacity. Active relationships are not touched (decision still open).
 *
 * Capacity = purchased(+comp for debrief). Active rows reserve capacity first;
 * leftover slots keep the newest pending invites; excess pending are revoked
 * oldest first.
 */
export async function revokeExcessPendingMentorInvites(
  supabase: SupabaseClient,
  mentorId: string,
  seatType: MentorSeatCapacityType,
): Promise<void> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "purchased_debrief_seats, purchased_evaluation_seats, comp_debrief_seats",
    )
    .eq("id", mentorId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `revokeExcessPendingMentorInvites: profile read failed: ${profileError.message}`,
    );
  }
  if (!profile) {
    return;
  }

  const purchased =
    seatType === "debrief"
      ? Number(profile.purchased_debrief_seats ?? 0)
      : Number(profile.purchased_evaluation_seats ?? 0);
  const comp =
    seatType === "debrief" ? Number(profile.comp_debrief_seats ?? 0) : 0;
  const capacity = Math.max(0, Math.floor(purchased) + Math.floor(comp));

  const { data: rows, error: listError } = await supabase
    .from("mentor_relationships")
    .select("id, status, created_at")
    .eq("mentor_id", mentorId)
    .eq("seat_type", seatType)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (listError) {
    throw new Error(
      `revokeExcessPendingMentorInvites: list failed: ${listError.message}`,
    );
  }

  const list = rows ?? [];
  const activeCount = list.filter((r) => r.status === "active").length;
  const pending = list.filter((r) => r.status === "pending");
  const keepPending = Math.max(0, capacity - activeCount);
  const revokeCount = Math.max(0, pending.length - keepPending);
  if (revokeCount === 0) {
    return;
  }

  // pending is oldest-first; revoke the oldest excess.
  const ids = pending.slice(0, revokeCount).map((r) => r.id);
  const endedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("mentor_relationships")
    .update({ status: "revoked", ended_at: endedAt })
    .in("id", ids)
    .eq("status", "pending");

  if (updateError) {
    throw new Error(
      `revokeExcessPendingMentorInvites: update failed: ${updateError.message}`,
    );
  }
}
