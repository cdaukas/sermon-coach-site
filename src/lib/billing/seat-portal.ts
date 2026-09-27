import Stripe from "stripe";
import { getMentorSeatTypeFromMetadata } from "@/lib/billing/stripe-webhook";

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
 * The Coach "Manage subscription" button is on the billing card whenever the
 * account is an active, non-comped Coach subscriber. Seat portal is hidden
 * then so the same portal is not offered twice.
 */
export function coachManageSubscriptionShowing(profile: {
  isComped: boolean;
  subscriptionActive: boolean;
}): boolean {
  return profile.subscriptionActive && !profile.isComped;
}

/**
 * Seat-only portal control. Requires a Stripe customer, at least one open
 * mentor-seat subscription, and no Coach manage button already on the page.
 */
export type BillingSeatPortalPlacement = "hidden" | "on-card" | "standalone";

/**
 * One control on the billing page. On the Developing others card when that
 * card is mounted, otherwise on its own. Never both.
 */
export function billingSeatPortalPlacement(input: {
  portalVisible: boolean;
  developingOthersCardMounted: boolean;
}): BillingSeatPortalPlacement {
  if (!input.portalVisible) {
    return "hidden";
  }
  if (input.developingOthersCardMounted) {
    return "on-card";
  }
  return "standalone";
}

export function showSeatBillingPortalButton(input: {
  stripeCustomerId: string | null | undefined;
  coachManageShowing: boolean;
  seatSubscriptionStatuses: readonly string[];
}): boolean {
  const customerId =
    typeof input.stripeCustomerId === "string"
      ? input.stripeCustomerId.trim()
      : "";
  if (!customerId || input.coachManageShowing) {
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
  coachManageShowing: boolean;
}): Promise<boolean> {
  const customerId =
    typeof input.stripeCustomerId === "string"
      ? input.stripeCustomerId.trim()
      : "";
  if (!customerId || input.coachManageShowing) {
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
      coachManageShowing: input.coachManageShowing,
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
