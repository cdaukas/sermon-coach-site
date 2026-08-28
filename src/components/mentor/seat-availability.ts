import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import type { MentorSeatType } from "@/lib/mentor/relationships";

export type SeatAvailability = {
  seatType: MentorSeatType;
  used: number;
  available: number;
  capacity: number;
};

/**
 * Available = held capacity minus seats already spent on a pending or active
 * relationship. Mirrors the arithmetic create_mentor_invite enforces, so the
 * button we show matches what the RPC will allow.
 */
export function seatAvailability(
  capacity: MentorSeatCapacity,
): SeatAvailability[] {
  return (["debrief", "evaluation"] as const).map((seatType) => {
    const slice = seatType === "debrief" ? capacity.debrief : capacity.evaluation;
    return {
      seatType,
      used: slice.used,
      capacity: slice.capacity,
      available: Math.max(0, slice.capacity - slice.used),
    };
  });
}

export function availableSeatTypes(
  capacity: MentorSeatCapacity,
): MentorSeatType[] {
  return seatAvailability(capacity)
    .filter((row) => row.available > 0)
    .map((row) => row.seatType);
}

/** Total held seats, used for the Classroom threshold only. */
export function totalHeldSeats(capacity: MentorSeatCapacity): number {
  return capacity.debrief.capacity + capacity.evaluation.capacity;
}
