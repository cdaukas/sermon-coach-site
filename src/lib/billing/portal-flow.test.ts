import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import { COACH_STRIPE_PRICE_IDS } from "./checkout";
import {
  buildAnnualSwitchFlow,
  createPortalSession,
  parsePortalIntent,
  PORTAL_INTENT_SWITCH_TO_ANNUAL,
  type PortalSessionCreator,
  type SubscriptionLister,
} from "./portal-flow";

const MONTHLY_PRICE = COACH_STRIPE_PRICE_IDS.monthly;
const ANNUAL_PRICE = COACH_STRIPE_PRICE_IDS.annual;

type ItemStub = {
  id: string;
  priceId?: string | null;
  discounts?: string[];
};

function subscriptionStub(options: {
  id?: string;
  items?: ItemStub[];
  discounts?: string[];
}): Stripe.Subscription {
  const items = options.items ?? [{ id: "si_monthly", priceId: MONTHLY_PRICE }];
  return {
    id: options.id ?? "sub_123",
    discounts: options.discounts ?? [],
    items: {
      data: items.map((item) => ({
        id: item.id,
        discounts: item.discounts ?? [],
        price: item.priceId === null ? null : { id: item.priceId ?? MONTHLY_PRICE },
      })),
    },
  } as unknown as Stripe.Subscription;
}

type CustomerStub =
  | { discount?: Stripe.Discount | null; deleted?: false }
  | { deleted: true }
  | { throws: true };

/** Records the params it was called with so the test can assert on them. */
function listerFor(
  subscriptions: Stripe.Subscription[],
  customer: CustomerStub = {},
) {
  const calls: Stripe.SubscriptionListParams[] = [];
  const customerLookups: string[] = [];
  const stripe: SubscriptionLister = {
    subscriptions: {
      list: async (params) => {
        calls.push(params);
        return { data: subscriptions };
      },
    },
    customers: {
      retrieve: async (id) => {
        customerLookups.push(id);
        if ("throws" in customer) {
          throw new Error("stripe is down");
        }
        return {
          id,
          ...customer,
        } as unknown as Stripe.Customer | Stripe.DeletedCustomer;
      },
    },
  };
  return { stripe, calls, customerLookups };
}

describe("parsePortalIntent", () => {
  it("accepts the one intent it knows", () => {
    assert.equal(
      parsePortalIntent({ intent: "switch_to_annual" }),
      PORTAL_INTENT_SWITCH_TO_ANNUAL,
    );
  });

  it("ignores an empty body, which is what Manage subscription sends", () => {
    assert.equal(parsePortalIntent({}), null);
    assert.equal(parsePortalIntent(null), null);
    assert.equal(parsePortalIntent(undefined), null);
  });

  it("ignores any other intent", () => {
    assert.equal(parsePortalIntent({ intent: "cancel_everything" }), null);
    assert.equal(parsePortalIntent({ intent: 42 }), null);
  });

  it("ignores a price or subscription smuggled alongside the intent", () => {
    // The parser returns the intent only. Nothing else in the body can reach
    // the flow, because the flow never reads the body.
    assert.equal(
      parsePortalIntent({
        intent: "switch_to_annual",
        price: "price_attacker",
        subscription: "sub_someone_else",
      }),
      PORTAL_INTENT_SWITCH_TO_ANNUAL,
    );
  });
});

describe("buildAnnualSwitchFlow, happy path", () => {
  it("builds subscription_update_confirm for the customer's own subscription", async () => {
    const { stripe } = listerFor([
      subscriptionStub({ id: "sub_live", items: [{ id: "si_live", priceId: MONTHLY_PRICE }] }),
    ]);

    const result = await buildAnnualSwitchFlow(stripe, "cus_live");
    assert.ok("flowData" in result, "expected a flow, got a fallback");

    assert.deepEqual(result.flowData, {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: "sub_live",
        items: [{ id: "si_live", price: ANNUAL_PRICE, quantity: 1 }],
      },
    });
  });

  it("never passes discounts", async () => {
    const { stripe } = listerFor([subscriptionStub({})]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_live");
    assert.ok("flowData" in result);
    assert.ok(
      !("discounts" in result.flowData.subscription_update_confirm!),
      "flow must not name a coupon",
    );
  });

  it("scopes the lookup to the given customer and to active subscriptions", async () => {
    const { stripe, calls } = listerFor([subscriptionStub({})]);
    await buildAnnualSwitchFlow(stripe, "cus_scoped");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].customer, "cus_scoped");
    assert.equal(calls[0].status, "active");
  });

  it("targets the annual price, not the monthly one it came from", async () => {
    const { stripe } = listerFor([subscriptionStub({})]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_live");
    assert.ok("flowData" in result);
    const [item] = result.flowData.subscription_update_confirm!.items;
    assert.equal(item.price, ANNUAL_PRICE);
    assert.notEqual(item.price, MONTHLY_PRICE);
  });
});

describe("buildAnnualSwitchFlow guards, each falling back with no flow", () => {
  it("falls back when there is no active subscription", async () => {
    const { stripe } = listerFor([]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_none");
    assert.deepEqual(result, { fallback: "no_active_subscription" });
  });

  it("falls back when the subscription has more than one item", async () => {
    const { stripe } = listerFor([
      subscriptionStub({
        items: [
          { id: "si_coach", priceId: MONTHLY_PRICE },
          { id: "si_seat", priceId: "price_mentor_seat" },
        ],
      }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_multi");
    assert.deepEqual(result, { fallback: "multiple_subscription_items" });
  });

  it("falls back when the current price is not Coach monthly", async () => {
    const { stripe } = listerFor([
      subscriptionStub({ items: [{ id: "si_other", priceId: "price_something_else" }] }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_other");
    assert.deepEqual(result, {
      fallback: "current_price_is_not_coach_monthly",
    });
  });

  it("falls back when the subscriber is already on annual", async () => {
    const { stripe } = listerFor([
      subscriptionStub({ items: [{ id: "si_annual", priceId: ANNUAL_PRICE }] }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_annual");
    assert.deepEqual(result, {
      fallback: "current_price_is_not_coach_monthly",
    });
  });

  it("falls back when the item carries no price at all", async () => {
    const { stripe } = listerFor([
      subscriptionStub({ items: [{ id: "si_priceless", priceId: null }] }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_priceless");
    assert.deepEqual(result, {
      fallback: "current_price_is_not_coach_monthly",
    });
  });

  it("falls back when the subscription carries a discount", async () => {
    const { stripe } = listerFor([
      subscriptionStub({ discounts: ["di_friend50"] }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_discounted");
    assert.deepEqual(result, {
      fallback: "subscription_carries_a_discount",
    });
  });

  it("falls back when the discount sits on the item rather than the subscription", async () => {
    const { stripe } = listerFor([
      subscriptionStub({
        items: [{ id: "si_monthly", priceId: MONTHLY_PRICE, discounts: ["di_comp100"] }],
      }),
    ]);
    const result = await buildAnnualSwitchFlow(stripe, "cus_item_discount");
    assert.deepEqual(result, {
      fallback: "subscription_carries_a_discount",
    });
  });

  it("falls back when the discount sits on the customer rather than the subscription", async () => {
    const { stripe } = listerFor([subscriptionStub({})], {
      discount: { id: "di_comp100" } as unknown as Stripe.Discount,
    });
    const result = await buildAnnualSwitchFlow(stripe, "cus_customer_discount");
    assert.deepEqual(result, { fallback: "customer_carries_a_discount" });
  });

  it("looks the customer up only after the cheaper guards have passed", async () => {
    // A subscription-level discount short-circuits, so the extra call is not
    // made on a request that was going to fall back anyway.
    const { stripe, customerLookups } = listerFor([
      subscriptionStub({ discounts: ["di_sub"] }),
    ]);
    await buildAnnualSwitchFlow(stripe, "cus_short_circuit");
    assert.deepEqual(customerLookups, []);

    const passing = listerFor([subscriptionStub({})]);
    await buildAnnualSwitchFlow(passing.stripe, "cus_reaches_lookup");
    assert.deepEqual(passing.customerLookups, ["cus_reaches_lookup"]);
  });

  it("falls back when the customer lookup throws", async () => {
    const { stripe } = listerFor([subscriptionStub({})], { throws: true });
    const result = await buildAnnualSwitchFlow(stripe, "cus_unreachable");
    assert.deepEqual(result, { fallback: "customer_lookup_failed" });
  });

  it("falls back when the customer has been deleted", async () => {
    const { stripe } = listerFor([subscriptionStub({})], { deleted: true });
    const result = await buildAnnualSwitchFlow(stripe, "cus_deleted");
    assert.deepEqual(result, { fallback: "customer_lookup_failed" });
  });

  it("returns no flowData on any fallback", async () => {
    const cases = [
      listerFor([]),
      listerFor([subscriptionStub({ discounts: ["di_x"] })]),
      listerFor([
        subscriptionStub({ items: [{ id: "a", priceId: "price_x" }] }),
      ]),
    ];
    for (const { stripe } of cases) {
      const result = await buildAnnualSwitchFlow(stripe, "cus_any");
      assert.ok(!("flowData" in result), "a guard must not produce a flow");
    }
  });
});

const FLOW_DATA = {
  type: "subscription_update_confirm",
  subscription_update_confirm: {
    subscription: "sub_live",
    items: [{ id: "si_live", price: ANNUAL_PRICE, quantity: 1 }],
  },
} as Stripe.BillingPortal.SessionCreateParams.FlowData;

/** Records every create call; optionally throws on the deep-linked one. */
function sessionCreatorThatRejectsFlows(options: { rejectFlow: boolean }) {
  const calls: Stripe.BillingPortal.SessionCreateParams[] = [];
  const stripe: PortalSessionCreator = {
    billingPortal: {
      sessions: {
        create: async (params) => {
          calls.push(params);
          if (options.rejectFlow && params.flow_data) {
            throw new Error(
              "The price specified in flow_data is not allowed by this portal configuration.",
            );
          }
          return { id: "bps_1", url: "https://billing.stripe.com/session" } as Stripe.BillingPortal.Session;
        },
      },
    },
  };
  return { stripe, calls };
}

describe("createPortalSession", () => {
  it("deep-links when the flow is accepted", async () => {
    const { stripe, calls } = sessionCreatorThatRejectsFlows({ rejectFlow: false });
    const session = await createPortalSession(stripe, {
      customerId: "cus_ok",
      returnUrl: "https://example.test/dashboard/buy",
      flowData: FLOW_DATA,
    });

    assert.equal(session.url, "https://billing.stripe.com/session");
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].flow_data, FLOW_DATA);
    assert.equal(calls[0].customer, "cus_ok");
    assert.equal(calls[0].return_url, "https://example.test/dashboard/buy");
  });

  it("falls back to a plain session when the flow session throws", async () => {
    const { stripe, calls } = sessionCreatorThatRejectsFlows({ rejectFlow: true });

    // No throw reaches the caller, so no error reaches the user.
    const session = await createPortalSession(stripe, {
      customerId: "cus_rejected",
      returnUrl: "https://example.test/dashboard/buy",
      flowData: FLOW_DATA,
    });

    assert.equal(session.url, "https://billing.stripe.com/session");
    assert.equal(calls.length, 2, "expected a retry after the flow was rejected");
    assert.deepEqual(calls[0].flow_data, FLOW_DATA);
    assert.equal(calls[1].flow_data, undefined, "the retry must carry no flow");
    assert.equal(calls[1].customer, "cus_rejected");
    assert.equal(calls[1].return_url, "https://example.test/dashboard/buy");
  });

  it("makes one plain call when there is no flow to begin with", async () => {
    const { stripe, calls } = sessionCreatorThatRejectsFlows({ rejectFlow: true });
    await createPortalSession(stripe, {
      customerId: "cus_manage",
      returnUrl: "https://example.test/dashboard/buy",
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].flow_data, undefined);
  });

  it("lets a plain session failure through to the caller", async () => {
    // Manage subscription's existing error handling must keep working: a
    // portal that is not configured at all is still a real error.
    const stripe: PortalSessionCreator = {
      billingPortal: {
        sessions: {
          create: async () => {
            throw new Error("No configuration provided");
          },
        },
      },
    };
    await assert.rejects(
      () =>
        createPortalSession(stripe, {
          customerId: "cus_unconfigured",
          returnUrl: "https://example.test/dashboard/buy",
        }),
      /No configuration provided/,
    );
  });
});
