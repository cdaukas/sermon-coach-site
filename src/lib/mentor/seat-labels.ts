import type { MentorSeatType } from "@/lib/mentor/relationships";

/**
 * Display labels for mentor seat_type values.
 * Database values stay `debrief` | `evaluation`; only UI copy maps here.
 */
export function mentorSeatDisplayName(seatType: MentorSeatType): string {
  return seatType === "debrief" ? "Apprentice" : "Colleague";
}
