import { createClient } from "@/lib/supabase/server";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import {
  parseMentorSeatCapacityPayload,
  type MentorSeatCapacity,
  type SeatCapacitySlice,
} from "@/lib/mentor/capacity-parse";

export type { MentorSeatCapacity, SeatCapacitySlice };

/**
 * Same formula create_mentor_invite enforces (via get_mentor_seat_capacity RPC).
 */
export async function getMentorSeatCapacity(): Promise<MentorSeatCapacity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_mentor_seat_capacity");

  if (error) {
    return null;
  }

  return parseMentorSeatCapacityPayload(data);
}

export function capacityForSeatType(
  capacity: MentorSeatCapacity,
  seatType: MentorSeatType,
): SeatCapacitySlice {
  return seatType === "debrief" ? capacity.debrief : capacity.evaluation;
}
