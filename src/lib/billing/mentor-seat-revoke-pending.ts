import type { SupabaseClient } from "@supabase/supabase-js";

export type MentorSeatCapacityType = "debrief" | "evaluation";

const SEAT_TYPES: MentorSeatCapacityType[] = ["debrief", "evaluation"];

export type RevokeExcessPendingOptions = {
  /**
   * Known purchased count for this seat type after a counter write.
   * Prefer this over re-reading profiles so cancel path cannot miss excess
   * pending if a re-read is stale or races the write.
   */
  purchasedSeats?: number;
};

/**
 * After capacity is known (usually right after a purchased-seat write), bring
 * used (pending + active) down to capacity for that seat type.
 *
 * Capacity = purchased(+comp for debrief). Close order: unaccepted invitations
 * first (oldest pending revoked), then the oldest active relationship until
 * used <= capacity. Comp is never written here. Held evaluations are not
 * released on an active close (unlike end_mentor_relationship).
 */
export async function revokeExcessPendingMentorInvites(
  supabase: SupabaseClient,
  mentorId: string,
  seatType: MentorSeatCapacityType,
  options?: RevokeExcessPendingOptions,
): Promise<void> {
  let purchased: number;
  let comp = 0;

  if (
    typeof options?.purchasedSeats === "number" &&
    Number.isFinite(options.purchasedSeats)
  ) {
    purchased = Math.max(0, Math.floor(options.purchasedSeats));
    if (seatType === "debrief") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("comp_debrief_seats")
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
      comp = Number(profile.comp_debrief_seats ?? 0);
    }
  } else {
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

    purchased =
      seatType === "debrief"
        ? Number(profile.purchased_debrief_seats ?? 0)
        : Number(profile.purchased_evaluation_seats ?? 0);
    comp =
      seatType === "debrief" ? Number(profile.comp_debrief_seats ?? 0) : 0;
  }

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
  const active = list.filter((r) => r.status === "active");
  const pending = list.filter((r) => r.status === "pending");
  const keepPending = Math.max(0, capacity - active.length);
  const revokeCount = Math.max(0, pending.length - keepPending);
  const endedAt = new Date().toISOString();

  if (revokeCount > 0) {
    // pending is oldest-first; revoke the oldest excess.
    const ids = pending.slice(0, revokeCount).map((r) => r.id);
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

  const endCount = Math.max(0, active.length - capacity);
  if (endCount === 0) {
    return;
  }

  const endIds = active.slice(0, endCount).map((r) => r.id);
  const { error: endError } = await supabase
    .from("mentor_relationships")
    // Deliberately does not release held evaluations. end_mentor_relationship
    // does, because a manual end is a considered act. A cancel can be an
    // expired card, and releasing a man's held scores on a failed payment
    // would be wrong. Do not "fix" this into parity with the RPC.
    .update({ status: "ended", ended_at: endedAt })
    .in("id", endIds)
    .eq("status", "active");

  if (endError) {
    throw new Error(
      `revokeExcessPendingMentorInvites: end failed: ${endError.message}`,
    );
  }
}

/**
 * Recompute excess pending and active relationships for every seat type
 * against current capacity. Call after any path that can move seat counters
 * for a mentor.
 */
export async function revokeExcessPendingForMentor(
  supabase: SupabaseClient,
  mentorId: string,
  options?: {
    /** When a write just set one type, pass that known value. */
    written?: { seatType: MentorSeatCapacityType; purchasedSeats: number };
  },
): Promise<void> {
  for (const seatType of SEAT_TYPES) {
    const written = options?.written;
    if (written && written.seatType === seatType) {
      await revokeExcessPendingMentorInvites(supabase, mentorId, seatType, {
        purchasedSeats: written.purchasedSeats,
      });
    } else {
      await revokeExcessPendingMentorInvites(supabase, mentorId, seatType);
    }
  }
}
