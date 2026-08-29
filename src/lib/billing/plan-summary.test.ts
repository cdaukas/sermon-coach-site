import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  developingOthersCopy,
  formatPlanDate,
  mentorSeatBreakdown,
  resolvePlanCopy,
  type PlanProfileFields,
} from "./plan-summary";

const now = new Date("2026-08-29T12:00:00.000Z");

const baseActive: PlanProfileFields = {
  isComped: false,
  subscriptionActive: true,
  discountNote: null,
  subscriptionInterval: "month",
  currentPeriodEnd: "2026-09-18T00:00:00.000Z",
};

describe("formatPlanDate", () => {
  it("uses Sept and omits the year in the same calendar year", () => {
    assert.equal(formatPlanDate("2026-09-18T00:00:00.000Z", now), "Sept 18");
  });

  it("includes the year when the date is in another year", () => {
    assert.equal(formatPlanDate("2027-06-08T00:00:00.000Z", now), "Jun 8, 2027");
  });
});

describe("resolvePlanCopy", () => {
  it("comped wins over a live monthly Stripe row", () => {
    const copy = resolvePlanCopy(
      {
        ...baseActive,
        isComped: true,
        subscriptionInterval: "month",
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, "Your account is comped.");
    assert.equal(copy.detail, "No charges, no renewal date.");
    assert.equal(copy.nudge, null);
    assert.equal(copy.actions, "none");
  });

  it("comped with null interval matches the same card", () => {
    const copy = resolvePlanCopy(
      {
        isComped: true,
        subscriptionActive: false,
        discountNote: null,
        subscriptionInterval: null,
        currentPeriodEnd: null,
      },
      { remaining: 4, expiryIso: "2027-01-01T00:00:00.000Z" },
      now,
    );
    assert.equal(copy.headline, "Your account is comped.");
    assert.equal(copy.detail, "No charges, no renewal date.");
    assert.equal(copy.actions, "none");
    assert.equal(copy.detail.includes("renews"), false);
  });

  it("inactive with pack credits uses the expiry date", () => {
    const copy = resolvePlanCopy(
      {
        isComped: false,
        subscriptionActive: false,
        discountNote: null,
        subscriptionInterval: null,
        currentPeriodEnd: null,
      },
      { remaining: 6, expiryIso: "2027-02-03T00:00:00.000Z" },
      now,
    );
    assert.equal(copy.headline, "No subscription.");
    assert.equal(
      copy.detail,
      "You have 6 pack credits, good through Feb 3, 2027.",
    );
    assert.equal(copy.actions, "start_coach");
  });

  it("inactive with no credits is the start-plan card", () => {
    const copy = resolvePlanCopy(
      {
        isComped: false,
        subscriptionActive: false,
        discountNote: null,
        subscriptionInterval: null,
        currentPeriodEnd: null,
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, "You're not on a plan.");
    assert.equal(copy.nudge, null);
    assert.equal(copy.actions, "start_coach");
  });

  it("active discount note appends renewal and has no nudge", () => {
    const copy = resolvePlanCopy(
      {
        ...baseActive,
        discountNote:
          "Coach. $14.50 a month, friend rate, 50% off.",
        subscriptionInterval: "month",
        currentPeriodEnd: "2026-09-18T00:00:00.000Z",
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, null);
    assert.equal(
      copy.detail,
      "Coach. $14.50 a month, friend rate, 50% off. Renews Sept 18.",
    );
    assert.equal(copy.nudge, null);
    assert.equal(copy.actions, "manage");
  });

  it("active annual discount note includes the year and has no nudge", () => {
    const copy = resolvePlanCopy(
      {
        ...baseActive,
        discountNote:
          "Coach annual. $145 a year, founding member rate, 50% off your first year.",
        subscriptionInterval: "year",
        currentPeriodEnd: "2027-06-08T00:00:00.000Z",
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, null);
    assert.equal(
      copy.detail,
      "Coach annual. $145 a year, founding member rate, 50% off your first year. Renews Jun 8, 2027.",
    );
    assert.equal(copy.nudge, null);
  });

  it("active monthly with no discount shows the annual nudge", () => {
    const copy = resolvePlanCopy(baseActive, { remaining: 0, expiryIso: null }, now);
    assert.equal(copy.headline, "Coach");
    assert.equal(
      copy.detail,
      "$29 a month, renews Sept 18. Ten evaluations a month.",
    );
    assert.equal(
      copy.nudge,
      "Switch to annual and pay $290 instead of $348. Two months free.",
    );
    assert.equal(copy.actions, "annual_and_manage");
  });

  it("active annual with no discount has no nudge", () => {
    const copy = resolvePlanCopy(
      {
        ...baseActive,
        subscriptionInterval: "year",
        currentPeriodEnd: "2027-06-08T00:00:00.000Z",
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, "Coach annual");
    assert.equal(
      copy.detail,
      "$290 a year, renews Jun 8, 2027. Ten evaluations a month.",
    );
    assert.equal(copy.nudge, null);
  });

  it("active with null interval does not print empty renews text", () => {
    const copy = resolvePlanCopy(
      {
        ...baseActive,
        subscriptionInterval: null,
        currentPeriodEnd: null,
      },
      { remaining: 0, expiryIso: null },
      now,
    );
    assert.equal(copy.headline, "Coach");
    assert.equal(copy.detail, "Ten evaluations a month.");
    assert.equal(copy.detail.includes("renews"), false);
    assert.equal(copy.nudge, null);
  });
});

describe("developingOthersCopy", () => {
  it("counts only active people and appends the unaccepted-invites sentence", () => {
    const copy = developingOthersCopy({
      activeSeatTypes: ["debrief", "debrief"],
      pendingSeatTypes: ["debrief"],
    });
    assert.equal(
      copy,
      "You're mentoring 2 people. 1 invitation is still unaccepted and you're paying for those seats.",
    );
  });

  it("uses the singular person sentence", () => {
    const copy = developingOthersCopy({
      activeSeatTypes: ["debrief"],
      pendingSeatTypes: [],
    });
    assert.equal(copy, "You're mentoring 1 person.");
  });

  it("does not put seat type or price in the sentence", () => {
    const copy = developingOthersCopy({
      activeSeatTypes: ["debrief", "evaluation"],
      pendingSeatTypes: [],
    });
    assert.equal(copy, "You're mentoring 2 people.");
  });

  it("returns null when the mentor has no seats", () => {
    assert.equal(
      developingOthersCopy({ activeSeatTypes: [], pendingSeatTypes: [] }),
      null,
    );
  });
});

describe("mentorSeatBreakdown", () => {
  it("prices apprentice seats at $12 and totals the month", () => {
    const breakdown = mentorSeatBreakdown({
      activeSeatTypes: ["debrief", "debrief"],
      pendingSeatTypes: ["debrief"],
    });
    assert.deepEqual(breakdown, {
      apprentice: 3,
      colleague: 0,
      monthlyTotal: 36,
    });
  });

  it("shows one monthly total across mixed seat types", () => {
    const breakdown = mentorSeatBreakdown({
      activeSeatTypes: ["debrief", "evaluation"],
      pendingSeatTypes: [],
    });
    assert.deepEqual(breakdown, {
      apprentice: 1,
      colleague: 1,
      monthlyTotal: 37,
    });
  });

  it("returns null when the mentor has no seats", () => {
    assert.equal(
      mentorSeatBreakdown({ activeSeatTypes: [], pendingSeatTypes: [] }),
      null,
    );
  });
});
