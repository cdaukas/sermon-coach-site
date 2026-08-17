import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import { createStripeCheckoutSession } from "./create-checkout-session";

function makeStripeMock() {
  const creates: Array<Record<string, unknown>> = [];
  const stripe = {
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          creates.push(params);
          return { id: "cs_test", url: "https://checkout.stripe.com/test" };
        },
      },
    },
  } as unknown as Stripe;
  return { stripe, creates };
}

const baseUrls = {
  userId: "user-1",
  customerId: "cus_1",
  successUrl: "https://example.com/success",
  cancelUrl: "https://example.com/cancel",
};

describe("createStripeCheckoutSession", () => {
  it("enables promotion codes on Coach subscription checkout without discounts", async () => {
    const { stripe, creates } = makeStripeMock();

    await createStripeCheckoutSession(stripe, {
      type: "subscription",
      priceId: "price_coach",
      ...baseUrls,
    });

    assert.equal(creates.length, 1);
    assert.equal(creates[0].allow_promotion_codes, true);
    assert.equal("discounts" in creates[0], false);
  });

  it("does not enable promotion codes on pack or mentor-seat checkout", async () => {
    const { stripe, creates } = makeStripeMock();

    await createStripeCheckoutSession(stripe, {
      type: "pack",
      priceId: "price_pack",
      ...baseUrls,
    });
    await createStripeCheckoutSession(stripe, {
      type: "mentor_seat",
      seatType: "debrief",
      priceId: "price_seat",
      quantity: 1,
      ...baseUrls,
    });

    assert.equal(creates.length, 2);
    assert.equal("allow_promotion_codes" in creates[0], false);
    assert.equal("allow_promotion_codes" in creates[1], false);
  });
});
