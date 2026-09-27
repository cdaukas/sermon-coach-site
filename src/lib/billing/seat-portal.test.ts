import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import {
  billingSeatPortalPlacement,
  listMentorSeatSubscriptionStatuses,
  showSeatBillingPortalButton,
} from "./seat-portal";

describe("showSeatBillingPortalButton", () => {
  it("shows the button for a seat-only account", () => {
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_seat",
        seatSubscriptionStatuses: ["active"],
      }),
      true,
    );
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_seat",
        seatSubscriptionStatuses: ["past_due"],
      }),
      true,
    );
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_seat",
        seatSubscriptionStatuses: ["trialing"],
      }),
      true,
    );
  });

  it("hides the button for a Coach-only account", () => {
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_coach",
        seatSubscriptionStatuses: [],
      }),
      false,
    );
  });

  it("shows the button for a Coach subscriber who also has an open seat", () => {
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_both",
        seatSubscriptionStatuses: ["active", "past_due"],
      }),
      true,
    );
  });

  it("hides the button when there is no customer id", () => {
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: null,
        seatSubscriptionStatuses: ["active"],
      }),
      false,
    );
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "   ",
        seatSubscriptionStatuses: ["active"],
      }),
      false,
    );
  });

  it("hides the button when every seat subscription is closed", () => {
    assert.equal(
      showSeatBillingPortalButton({
        stripeCustomerId: "cus_seat",
        seatSubscriptionStatuses: ["canceled", "unpaid"],
      }),
      false,
    );
  });
});

describe("billingSeatPortalPlacement", () => {
  function place(input: {
    seatSubscriptionStatuses: readonly string[];
    activeOrPendingRelationships: number;
  }) {
    const portalVisible = showSeatBillingPortalButton({
      stripeCustomerId: "cus_seat",
      seatSubscriptionStatuses: input.seatSubscriptionStatuses,
    });
    return billingSeatPortalPlacement({
      portalVisible,
      developingOthersCardMounted: input.activeOrPendingRelationships > 0,
    });
  }

  it("stands alone for a past_due seat after relationships have closed", () => {
    assert.equal(
      place({
        seatSubscriptionStatuses: ["past_due"],
        activeOrPendingRelationships: 0,
      }),
      "standalone",
    );
  });

  it("stands alone for a seat-only account with no invites yet", () => {
    assert.equal(
      place({
        seatSubscriptionStatuses: ["active"],
        activeOrPendingRelationships: 0,
      }),
      "standalone",
    );
  });

  it("sits on the Developing others card once, not twice", () => {
    assert.equal(
      place({
        seatSubscriptionStatuses: ["active"],
        activeOrPendingRelationships: 1,
      }),
      "on-card",
    );
  });
});

describe("listMentorSeatSubscriptionStatuses", () => {
  it("keeps open seat subscriptions and ignores Coach", async () => {
    const statuses = await listMentorSeatSubscriptionStatuses(
      {
        subscriptions: {
          async list() {
            return {
              data: [
                {
                  id: "sub_coach",
                  status: "active",
                  metadata: { checkout_type: "subscription" } as Stripe.Metadata,
                },
                {
                  id: "sub_seat",
                  status: "past_due",
                  metadata: {
                    checkout_type: "mentor_seat",
                    seat_type: "debrief",
                  } as Stripe.Metadata,
                },
              ],
              has_more: false,
            };
          },
        },
      },
      "cus_seat",
    );

    assert.deepEqual(statuses, ["past_due"]);
  });
});
