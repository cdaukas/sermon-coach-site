import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import { COACH_STRIPE_PRICE_IDS } from "./checkout";
import {
  buildAnnualSwitchFlow,
  parsePortalIntent,
  PORTAL_INTENT_SWITCH_TO_ANNUAL,
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

/** Records the params it was called with so the test can assert on them. */
function listerFor(subscriptions: Stripe.Subscription[]) {
  const calls: Stripe.SubscriptionListParams[] = [];
  const stripe: SubscriptionLister = {
    subscriptions: {
      list: async (params) => {
        calls.push(params);
        return { data: subscriptions };
      },
    },
  };
  return { stripe, calls };
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
