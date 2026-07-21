import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthCallbackUrl,
  buildCheckoutPath,
  buildPackCheckoutPath,
  COACH_STRIPE_PRICE_IDS,
  getCoachPriceId,
  getPackPriceId,
  PACK_STRIPE_PRICE_IDS,
  parseCoachCheckoutParams,
  parsePackCheckoutParams,
} from "./checkout";

describe("checkout params", () => {
  it("parses valid coach monthly and annual params", () => {
    assert.deepEqual(
      parseCoachCheckoutParams(new URLSearchParams("plan=coach&cadence=monthly")),
      { plan: "coach", cadence: "monthly" },
    );
    assert.deepEqual(
      parseCoachCheckoutParams(new URLSearchParams("plan=coach&cadence=annual")),
      { plan: "coach", cadence: "annual" },
    );
  });

  it("rejects cohort and invalid cadence", () => {
    assert.equal(
      parseCoachCheckoutParams(new URLSearchParams("plan=cohort&cadence=monthly")),
      null,
    );
    assert.equal(
      parseCoachCheckoutParams(new URLSearchParams("plan=coach&cadence=weekly")),
      null,
    );
  });

  it("builds callback URL that preserves checkout path round-trip", () => {
    const callbackUrl = buildAuthCallbackUrl(
      "https://sermoncoach.online",
      buildCheckoutPath("monthly"),
    );
    assert.equal(
      callbackUrl,
      "https://sermoncoach.online/auth/callback?next=%2Fcheckout%3Fplan%3Dcoach%26cadence%3Dmonthly",
    );
  });

  it("builds callback URL that preserves claim token in next path", () => {
    const callbackUrl = buildAuthCallbackUrl(
      "https://sermoncoach.online",
      "/start?claim=abc-123",
    );
    assert.equal(
      callbackUrl,
      "https://sermoncoach.online/auth/callback?next=%2Fstart%3Fclaim%3Dabc-123",
    );
  });

  it("maps coach cadence to Stripe price IDs", () => {
    assert.equal(
      getCoachPriceId("monthly"),
      COACH_STRIPE_PRICE_IDS.monthly,
    );
    assert.equal(
      getCoachPriceId("annual"),
      COACH_STRIPE_PRICE_IDS.annual,
    );
  });

  it("parses valid pack checkout params", () => {
    assert.deepEqual(parsePackCheckoutParams(new URLSearchParams("pack=pack_2")), {
      pack: "pack_2",
    });
    assert.deepEqual(parsePackCheckoutParams(new URLSearchParams("pack=pack_12")), {
      pack: "pack_12",
    });
  });

  it("rejects invalid pack params", () => {
    assert.equal(parsePackCheckoutParams(new URLSearchParams("pack=pack_3")), null);
    assert.equal(parsePackCheckoutParams(new URLSearchParams("plan=coach&cadence=monthly")), null);
  });

  it("builds pack checkout path", () => {
    assert.equal(buildPackCheckoutPath("pack_6"), "/checkout?pack=pack_6");
  });

  it("maps pack sku to Stripe price IDs", () => {
    assert.equal(getPackPriceId("pack_2"), PACK_STRIPE_PRICE_IDS.pack_2);
    assert.equal(getPackPriceId("pack_6"), PACK_STRIPE_PRICE_IDS.pack_6);
    assert.equal(getPackPriceId("pack_12"), PACK_STRIPE_PRICE_IDS.pack_12);
  });
});
