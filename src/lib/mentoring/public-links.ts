import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";

/** Public Mentoring CTAs. Same routes the pricing page already uses. */
export const APPRENTICE_SEAT_CHECKOUT_PATH =
  buildMentorSeatCheckoutPath("debrief");

export const COLLEAGUE_SEAT_CHECKOUT_PATH =
  buildMentorSeatCheckoutPath("evaluation");

/** Classroom is a section of the pricing page, not its own route. */
export const CLASSROOM_PATH = "/pricing.html#classroom";

/** Own-preaching card under the homepage hero. Plan and pack live on pricing. */
export const OWN_PREACHING_PATH = "/pricing.html";
