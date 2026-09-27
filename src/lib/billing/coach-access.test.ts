import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowsCoachSurface, hasActiveCoach } from "./coach-access";

const inactiveCoach = {
  flag: false,
  is_comped: false,
  subscription_status: "inactive",
  plan_tier: "coach",
};

describe("hasActiveCoach", () => {
  it("allows a monthly Coach subscription", () => {
    const monthly = {
      subscription_status: "active" as const,
      plan_tier: "coach" as const,
      subscription_interval: "month",
    };
    assert.equal(hasActiveCoach(monthly), true);
    assert.equal(allowsCoachSurface({ ...inactiveCoach, ...monthly }), true);
  });

  it("allows an annual Coach subscription", () => {
    const annual = {
      subscription_status: "active" as const,
      plan_tier: "coach" as const,
      subscription_interval: "year",
    };
    assert.equal(hasActiveCoach(annual), true);
    assert.equal(allowsCoachSurface({ ...inactiveCoach, ...annual }), true);
  });

  it("rejects an inactive Coach subscription", () => {
    assert.equal(hasActiveCoach(inactiveCoach), false);
    assert.equal(allowsCoachSurface(inactiveCoach), false);
  });
});

describe("allowsCoachSurface", () => {
  it("allows a comped account without a subscription", () => {
    assert.equal(
      allowsCoachSurface({ ...inactiveCoach, is_comped: true }),
      true,
    );
  });

  it("allows a flag-only override", () => {
    assert.equal(
      allowsCoachSurface({ ...inactiveCoach, flag: true }),
      true,
    );
  });

  it("excludes seat-only, pack-only, and free accounts", () => {
    const seatOnly = { ...inactiveCoach };
    const packOnly = { ...inactiveCoach };
    const free = { ...inactiveCoach };
    assert.equal(allowsCoachSurface(seatOnly), false);
    assert.equal(allowsCoachSurface(packOnly), false);
    assert.equal(allowsCoachSurface(free), false);
  });
});
