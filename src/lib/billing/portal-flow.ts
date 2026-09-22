import type Stripe from "stripe";
import { getCoachPriceId } from "@/lib/billing/checkout";

/**
 * The only intent the portal route accepts from a client. Everything the flow
 * needs (subscription id, item id, target price) is derived server-side from
 * the signed-in user's own stripe_customer_id. A price or subscription id from
 * the request body is never read.
 */
export const PORTAL_INTENT_SWITCH_TO_ANNUAL = "switch_to_annual";

export type PortalIntent = typeof PORTAL_INTENT_SWITCH_TO_ANNUAL;

export function parsePortalIntent(body: unknown): PortalIntent | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const intent = (body as { intent?: unknown }).intent;
  return intent === PORTAL_INTENT_SWITCH_TO_ANNUAL
    ? PORTAL_INTENT_SWITCH_TO_ANNUAL
    : null;
}

/**
 * Why a switch_to_annual request fell back to a plain portal session. Every
 * value is a safe outcome: the customer lands on the portal front page, which
 * is exactly the behaviour that shipped before the deep link existed.
 */
export type AnnualFlowFallbackReason =
  | "no_active_subscription"
  | "multiple_subscription_items"
  | "current_price_is_not_coach_monthly"
  | "subscription_carries_a_discount";

export type AnnualFlowResult =
  | { flowData: Stripe.BillingPortal.SessionCreateParams.FlowData }
  | { fallback: AnnualFlowFallbackReason };

/** Narrow surface so tests can supply a stub instead of a real Stripe client. */
export type SubscriptionLister = {
  subscriptions: {
    list: (
      params: Stripe.SubscriptionListParams,
    ) => Promise<{ data: Stripe.Subscription[] }>;
  };
};

function hasDiscount(subscription: Stripe.Subscription): boolean {
  if (Array.isArray(subscription.discounts) && subscription.discounts.length > 0) {
    return true;
  }
  // A discount attached to the single item counts too: it reduces the same
  // invoice, and switching the price is what would put it at risk.
  return subscription.items.data.some(
    (item) => Array.isArray(item.discounts) && item.discounts.length > 0,
  );
}

/**
 * Build the flow_data that lands a Coach monthly subscriber directly on a
 * "confirm Coach annual" screen, or say why we are falling back.
 *
 * Deliberately does not pass `discounts`: this only ever runs for a
 * subscription that carries none, and naming a coupon here would be inventing
 * a discount rather than preserving one.
 */
export async function buildAnnualSwitchFlow(
  stripe: SubscriptionLister,
  customerId: string,
): Promise<AnnualFlowResult> {
  const { data } = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 2,
  });

  const subscription = data[0];
  if (!subscription) {
    return { fallback: "no_active_subscription" };
  }

  const items = subscription.items.data;
  if (items.length !== 1) {
    return { fallback: "multiple_subscription_items" };
  }

  const item = items[0];
  const currentPriceId = item.price?.id ?? null;
  if (currentPriceId !== getCoachPriceId("monthly")) {
    return { fallback: "current_price_is_not_coach_monthly" };
  }

  if (hasDiscount(subscription)) {
    return { fallback: "subscription_carries_a_discount" };
  }

  return {
    flowData: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscription.id,
        items: [
          {
            id: item.id,
            price: getCoachPriceId("annual"),
            quantity: 1,
          },
        ],
      },
    },
  };
}
