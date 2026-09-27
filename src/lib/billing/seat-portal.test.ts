import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity-parse";
import { SEAT_END_RELEASE_NOTICE } from "@/lib/mentor/seat-end-notice";
import {
  developingOthersBillingSection,
  developingOthersReleaseLine,
  idleSeatSummaryLines,
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

function emptySlice() {
  return { used: 0, capacity: 0, purchased: 0, comp: 0 };
}

describe("developingOthersBillingSection", () => {
  it("shows the upsell when there is no open seat subscription", () => {
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: false,
        activeOrPendingRelationships: false,
        seatDiscoveryEligible: true,
      }),
      "upsell",
    );
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: false,
        activeOrPendingRelationships: false,
        seatDiscoveryEligible: false,
      }),
      null,
    );
  });

  it("shows one open-seats card when a subscription is open and nobody is on it", () => {
    const pastDueOpen = showSeatBillingPortalButton({
      stripeCustomerId: "cus_seat",
      seatSubscriptionStatuses: ["past_due"],
    });
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: pastDueOpen,
        activeOrPendingRelationships: false,
        seatDiscoveryEligible: true,
      }),
      "open-seats",
    );
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: showSeatBillingPortalButton({
          stripeCustomerId: "cus_seat",
          seatSubscriptionStatuses: ["active"],
        }),
        activeOrPendingRelationships: false,
        seatDiscoveryEligible: true,
      }),
      "open-seats",
    );
    assert.equal(developingOthersReleaseLine("open-seats"), null);
    assert.equal(
      developingOthersReleaseLine("relationships"),
      SEAT_END_RELEASE_NOTICE,
    );
  });

  it("keeps the relationships card when someone is active or pending", () => {
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: true,
        activeOrPendingRelationships: true,
        seatDiscoveryEligible: false,
      }),
      "relationships",
    );
    assert.equal(
      developingOthersBillingSection({
        openSeatSubscription: false,
        activeOrPendingRelationships: true,
        seatDiscoveryEligible: true,
      }),
      "relationships",
    );
  });
});

describe("idleSeatSummaryLines", () => {
  it("names a held empty seat the way Your seats does", () => {
    const capacity: MentorSeatCapacity = {
      debrief: { ...emptySlice(), capacity: 1, purchased: 1 },
      evaluation: emptySlice(),
    };
    assert.deepEqual(idleSeatSummaryLines(capacity), [
      "Apprentice · 1 available",
    ]);
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
