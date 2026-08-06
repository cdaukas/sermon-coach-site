import { createClient } from "@/lib/supabase/server";
import type { MentorSeatType } from "@/lib/mentor/relationships";

export type SeatCapacitySlice = {
  used: number;
  capacity: number;
  purchased: number;
  comp: number;
};

export type MentorSeatCapacity = {
  debrief: SeatCapacitySlice;
  evaluation: SeatCapacitySlice;
};

function asNonNegInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function asSlice(raw: unknown): SeatCapacitySlice {
  if (!raw || typeof raw !== "object") {
    return { used: 0, capacity: 0, purchased: 0, comp: 0 };
  }
  const row = raw as Record<string, unknown>;
  return {
    used: asNonNegInt(row.used),
    capacity: asNonNegInt(row.capacity),
    purchased: asNonNegInt(row.purchased),
    comp: asNonNegInt(row.comp),
  };
}

/**
 * Same formula create_mentor_invite enforces (via get_mentor_seat_capacity RPC).
 */
export async function getMentorSeatCapacity(): Promise<MentorSeatCapacity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_mentor_seat_capacity");

  if (error || !data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  if (payload.ok !== true) {
    return null;
  }

  return {
    debrief: asSlice(payload.debrief),
    evaluation: asSlice(payload.evaluation),
  };
}

export function capacityForSeatType(
  capacity: MentorSeatCapacity,
  seatType: MentorSeatType,
): SeatCapacitySlice {
  return seatType === "debrief" ? capacity.debrief : capacity.evaluation;
}
