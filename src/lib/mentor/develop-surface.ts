import type { MentorSeatCapacity } from "@/lib/mentor/capacity";

export type MentoringDevelopSurface = "error" | "purchase" | "workspace";

/**
 * Failed fetch is null and must not become the sales state.
 * A 0/0 object is a real empty result and may sell seats.
 */
export function mentoringDevelopSurface(
  capacity: MentorSeatCapacity | null,
): MentoringDevelopSurface {
  if (!capacity) {
    return "error";
  }
  if (capacity.debrief.capacity === 0 && capacity.evaluation.capacity === 0) {
    return "purchase";
  }
  return "workspace";
}
