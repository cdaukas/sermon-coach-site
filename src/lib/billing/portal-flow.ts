import Stripe from "stripe";
import { getCoachPriceId } from "@/lib/billing/checkout";

/**
 * Intents the portal route accepts from a client. Everything the flow needs
 * (subscription id, item id, target price, portal configuration) is derived
 * server-side. A price, subscription id, or configuration id from the request
 * body is never read.
 */
export const PORTAL_INTENT_SWITCH_TO_ANNUAL = "switch_to_annual";
export const PORTAL_INTENT_MANAGE_SEATS = "manage_seats";

export const SEAT_PORTAL_CONFIGURATION_ENV = "STRIPE_SEAT_PORTAL_CONFIGURATION_ID";
export const ANNUAL_PORTAL_CONFIGURATION_ENV =
  "STRIPE_ANNUAL_PORTAL_CONFIGURATION_ID";

export type PortalIntent =
  | typeof PORTAL_INTENT_SWITCH_TO_ANNUAL
  | typeof PORTAL_INTENT_MANAGE_SEATS;

export function parsePortalIntent(body: unknown): PortalIntent | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const intent = (body as { intent?: unknown }).intent;
  if (intent === PORTAL_INTENT_SWITCH_TO_ANNUAL) {
    return PORTAL_INTENT_SWITCH_TO_ANNUAL;
  }
  if (intent === PORTAL_INTENT_MANAGE_SEATS) {
    return PORTAL_INTENT_MANAGE_SEATS;
  }
  return null;
}

/**
 * Portal configuration for this session. A missing variable keeps today's
 * default-configuration session and logs a warning. It does not throw.
 */
export function readOptionalPortalConfiguration(
  envName: string,
): string | undefined {
  const value = process.env[envName]?.trim() ?? "";
  if (!value) {
    console.warn(
      `Billing portal: ${envName} is not set; using the default portal configuration.`,
    );
    return undefined;
  }
  return value;
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
  | "subscription_carries_a_discount"
  | "customer_carries_a_discount"
  | "customer_lookup_failed";

export type AnnualFlowResult =
  | { flowData: Stripe.BillingPortal.SessionCreateParams.FlowData }
  | { fallback: AnnualFlowFallbackReason };

/** Narrow surface so tests can supply a stub instead of a real Stripe client. */
export type SubscriptionPage = {
  data: Stripe.Subscription[];
  has_more?: boolean;
};

export type SubscriptionLister = {
  subscriptions: {
    list: (
      params: Stripe.SubscriptionListParams,
    ) => Promise<SubscriptionPage>;
  };
  customers: {
    retrieve: (
      id: string,
    ) => Promise<Stripe.Customer | Stripe.DeletedCustomer>;
  };
};

/** Just enough of the client to open a portal session. */
export type PortalSessionCreator = {
  billingPortal: {
    sessions: {
      create: (
        params: Stripe.BillingPortal.SessionCreateParams,
      ) => Promise<Stripe.BillingPortal.Session>;
    };
  };
};

function itemPriceId(item: Stripe.SubscriptionItem): string | null {
  const price = item.price;
  if (typeof price === "string") {
    return price;
  }
  return price?.id ?? null;
}

/**
 * The active subscription whose single item is the Coach monthly price.
 * A newer seat subscription on the same customer is skipped.
 */
export async function findCoachMonthlySubscription(
  stripe: SubscriptionLister,
  customerId: string,
): Promise<
  | { ok: true; subscription: Stripe.Subscription; itemId: string }
  | { ok: false; fallback: AnnualFlowFallbackReason }
> {
  let startingAfter: string | undefined;
  let sawAny = false;
  let sawMultiItemCoachMonthly = false;

  for (let page = 0; page < 5; page += 1) {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const subscription of list.data) {
      sawAny = true;
      const items = subscription.items?.data ?? [];
      const monthlyItem = items.find(
        (item) => itemPriceId(item) === getCoachPriceId("monthly"),
      );
      if (!monthlyItem) {
        continue;
      }
      if (items.length !== 1) {
        sawMultiItemCoachMonthly = true;
        continue;
      }
      return { ok: true, subscription, itemId: monthlyItem.id };
    }

    if (!list.has_more || list.data.length === 0) {
      break;
    }
    startingAfter = list.data[list.data.length - 1]?.id;
    if (!startingAfter) {
      break;
    }
  }

  if (!sawAny) {
    return { ok: false, fallback: "no_active_subscription" };
  }
  if (sawMultiItemCoachMonthly) {
    return { ok: false, fallback: "multiple_subscription_items" };
  }
  return { ok: false, fallback: "current_price_is_not_coach_monthly" };
}

/**
 * Switch to annual is offered only when a Coach monthly subscription exists.
 * `coachMonthlySubscriptionFound: null` means the lookup failed; keep the
 * button, which is today's behavior.
 */
export function annualSwitchButtonVisible(input: {
  planOffersAnnualSwitch: boolean;
  coachMonthlySubscriptionFound: boolean | null;
}): boolean {
  if (!input.planOffersAnnualSwitch) {
    return false;
  }
  if (input.coachMonthlySubscriptionFound === null) {
    return true;
  }
  return input.coachMonthlySubscriptionFound;
}

export async function loadAnnualSwitchButtonVisible(
  stripeCustomerId: string | null | undefined,
): Promise<boolean> {
  const customerId =
    typeof stripeCustomerId === "string" ? stripeCustomerId.trim() : "";
  if (!customerId) {
    return false;
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.warn(
      "Billing portal: missing STRIPE_SECRET_KEY; leaving Switch to annual visible.",
    );
    return true;
  }

  try {
    const stripe = new Stripe(secret);
    const found = await findCoachMonthlySubscription(stripe, customerId);
    return found.ok;
  } catch (error) {
    console.warn(
      "Billing portal: could not list subscriptions for Switch to annual; leaving the button visible.",
      error instanceof Error ? error.message : error,
    );
    return true;
  }
}

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
  const found = await findCoachMonthlySubscription(stripe, customerId);
  if (!found.ok) {
    return { fallback: found.fallback };
  }

  const { subscription, itemId } = found;

  if (hasDiscount(subscription)) {
    return { fallback: "subscription_carries_a_discount" };
  }

  // A coupon on the customer reduces the same invoices, so a price switch puts
  // it at the same risk. Worth one extra call on a rarely pressed button
  // rather than trusting a hand-maintained discount_note to have caught it.
  let customer: Stripe.Customer | Stripe.DeletedCustomer;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch {
    return { fallback: "customer_lookup_failed" };
  }

  if (customer.deleted) {
    return { fallback: "customer_lookup_failed" };
  }

  if (customer.discount) {
    return { fallback: "customer_carries_a_discount" };
  }

  return {
    flowData: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscription.id,
        items: [
          {
            id: itemId,
            price: getCoachPriceId("annual"),
            quantity: 1,
          },
        ],
      },
    },
  };
}

/**
 * Open a portal session, deep-linked when flowData is given.
 *
 * Stripe rejects a flow whose target price is not allowed by the live portal
 * configuration, and that rejection must not become a dead button. A throw
 * from the deep-linked call is logged and retried as a plain session, which is
 * the behaviour that shipped before the deep link. A throw from the plain call
 * is the caller's to handle, exactly as before.
 */
export async function createPortalSession(
  stripe: PortalSessionCreator,
  params: {
    customerId: string;
    returnUrl: string;
    flowData?: Stripe.BillingPortal.SessionCreateParams.FlowData;
    /**
     * Seat sessions pass the seat configuration. The annual confirm session
     * passes the annual configuration. A rejected deep link retries without
     * either, on the default configuration.
     */
    configuration?: string;
  },
): Promise<Stripe.BillingPortal.Session> {
  const base = {
    customer: params.customerId,
    return_url: params.returnUrl,
  };

  if (params.flowData) {
    try {
      return await stripe.billingPortal.sessions.create({
        ...base,
        flow_data: params.flowData,
        ...(params.configuration ? { configuration: params.configuration } : {}),
      });
    } catch (error) {
      console.error(
        "Billing portal: flow_data session failed, retrying without the deep link. The target price is most likely not allowed by the portal configuration.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return stripe.billingPortal.sessions.create({
    ...base,
    ...(params.flowData || !params.configuration
      ? {}
      : { configuration: params.configuration }),
  });
}
