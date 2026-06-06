import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthCallbackUrl,
  buildCheckoutPath,
  COACH_STRIPE_CHECKOUT_URLS,
  getCoachStripeCheckoutUrl,
  parseCoachCheckoutParams,
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

  it("maps coach cadence to Stripe Payment Links", () => {
    assert.equal(
      getCoachStripeCheckoutUrl("monthly"),
      COACH_STRIPE_CHECKOUT_URLS.monthly,
    );
    assert.equal(
      getCoachStripeCheckoutUrl("annual"),
      COACH_STRIPE_CHECKOUT_URLS.annual,
    );
  });
});
