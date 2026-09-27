import Stripe from "stripe";
import { getMentorSeatTypeFromMetadata } from "@/lib/billing/stripe-webhook";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity-parse";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import type { MentorSeatType } from "@/lib/mentor/relationships";

/** Statuses on which a seat subscription can still be managed in the portal. */
const OPEN_SEAT_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function seatSubscriptionOpensPortal(status: string): boolean {
  return OPEN_SEAT_SUBSCRIPTION_STATUSES.has(status);
}

/**
 * Which Developing others section the billing page mounts. At most one.
 * An open seat subscription with no active or pending relationship is its
 * own card, not the upsell and not a second portal block. The portal button
 * still follows showSeatBillingPortalButton, including past_due.
 */
export type DevelopingOthersBillingSection =
  | "upsell"
  | "open-seats"
  | "relationships";

export function developingOthersBillingSection(input: {
  openSeatSubscription: boolean;
  activeOrPendingRelationships: boolean;
  seatDiscoveryEligible: boolean;
}): DevelopingOthersBillingSection | null {
  if (input.activeOrPendingRelationships) {
    return "relationships";
  }
  if (input.openSeatSubscription) {
    return "open-seats";
  }
  if (input.seatDiscoveryEligible) {
    return "upsell";
  }
  return null;
}

/**
 * Held seats with nobody on them, in the Your seats shape:
 * "Apprentice · 1 available".
 */
export function idleSeatSummaryLines(capacity: MentorSeatCapacity): string[] {
  const rows: { seatType: MentorSeatType; available: number; capacity: number }[] =
    [
      {
        seatType: "debrief",
        capacity: capacity.debrief.capacity,
        available: Math.max(0, capacity.debrief.capacity - capacity.debrief.used),
      },
      {
        seatType: "evaluation",
        capacity: capacity.evaluation.capacity,
        available: Math.max(
          0,
          capacity.evaluation.capacity - capacity.evaluation.used,
        ),
      },
    ];

  return rows
    .filter((row) => row.capacity > 0)
    .map(
      (row) =>
        `${mentorSeatDisplayName(row.seatType)} · ${row.available} available`,
    );
}

export function showSeatBillingPortalButton(input: {
  stripeCustomerId: string | null | undefined;
  seatSubscriptionStatuses: readonly string[];
}): boolean {
  const customerId =
    typeof input.stripeCustomerId === "string"
      ? input.stripeCustomerId.trim()
      : "";
  if (!customerId) {
    return false;
  }
  return input.seatSubscriptionStatuses.some(seatSubscriptionOpensPortal);
}

type ListedSubscription = {
  id: string;
  status: string;
  metadata?: Stripe.Metadata | null;
};

type SeatSubscriptionList = {
  subscriptions: {
    list: (params: {
      customer: string;
      status: "all";
      limit: number;
      starting_after?: string;
    }) => Promise<{ data: ListedSubscription[]; has_more: boolean }>;
  };
};

/**
 * Statuses of this customer's mentor-seat subscriptions. Coach and pack
 * subscriptions are ignored. Identified the same way as the webhook:
 * checkout_type=mentor_seat and seat_type debrief|evaluation.
 */
export async function listMentorSeatSubscriptionStatuses(
  stripe: SeatSubscriptionList,
  customerId: string,
): Promise<string[]> {
  const statuses: string[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < 5; page += 1) {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of list.data) {
      if (!getMentorSeatTypeFromMetadata(sub.metadata)) {
        continue;
      }
      statuses.push(sub.status);
    }

    if (!list.has_more || list.data.length === 0) {
      break;
    }
    startingAfter = list.data[list.data.length - 1]?.id;
    if (!startingAfter) {
      break;
    }
  }

  return statuses;
}

/**
 * Whether to render "Manage seats and billing". A Stripe failure hides the
 * button; the rest of the page still renders.
 */
export async function loadSeatBillingPortalVisible(input: {
  stripeCustomerId: string | null | undefined;
}): Promise<boolean> {
  const customerId =
    typeof input.stripeCustomerId === "string"
      ? input.stripeCustomerId.trim()
      : "";
  if (!customerId) {
    return false;
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return false;
  }

  try {
    const stripe = new Stripe(secret);
    const statuses = await listMentorSeatSubscriptionStatuses(
      stripe,
      customerId,
    );
    return showSeatBillingPortalButton({
      stripeCustomerId: customerId,
      seatSubscriptionStatuses: statuses,
    });
  } catch (error) {
    console.error(
      "Seat billing portal: could not list seat subscriptions",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}
