import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import {
  canAccessMentoringUi,
  hasMentorSeatCapacity,
} from "@/lib/mentor/uiAccess";

const emptySlice = { used: 0, capacity: 0, purchased: 0, comp: 0 };

function capacityWith(
  debrief: number,
  evaluation: number,
): MentorSeatCapacity {
  return {
    debrief: { ...emptySlice, capacity: debrief, purchased: debrief },
    evaluation: {
      ...emptySlice,
      capacity: evaluation,
      purchased: evaluation,
    },
  };
}

const originalAllowlist = process.env.MENTORING_UI_ALLOWLIST;

afterEach(() => {
  if (originalAllowlist === undefined) {
    delete process.env.MENTORING_UI_ALLOWLIST;
  } else {
    process.env.MENTORING_UI_ALLOWLIST = originalAllowlist;
  }
});

describe("hasMentorSeatCapacity", () => {
  it("is false for null and for zero on both types", () => {
    assert.equal(hasMentorSeatCapacity(null), false);
    assert.equal(hasMentorSeatCapacity(capacityWith(0, 0)), false);
  });

  it("is true when either seat type has capacity", () => {
    assert.equal(hasMentorSeatCapacity(capacityWith(1, 0)), true);
    assert.equal(hasMentorSeatCapacity(capacityWith(0, 1)), true);
  });
});

describe("canAccessMentoringUi", () => {
  it("lets an allowlisted user in with no seats", () => {
    process.env.MENTORING_UI_ALLOWLIST = "mentor-a, mentor-b";
    assert.equal(canAccessMentoringUi("mentor-a", null), true);
    assert.equal(canAccessMentoringUi("mentor-a", capacityWith(0, 0)), true);
  });

  it("lets a non-allowlisted user in when they hold a purchased seat", () => {
    process.env.MENTORING_UI_ALLOWLIST = "someone-else";
    assert.equal(canAccessMentoringUi("buyer", capacityWith(1, 0)), true);
    assert.equal(canAccessMentoringUi("buyer", capacityWith(0, 1)), true);
  });

  it("404s a user with no seats and no allowlist entry", () => {
    process.env.MENTORING_UI_ALLOWLIST = "someone-else";
    assert.equal(canAccessMentoringUi("stranger", null), false);
    assert.equal(canAccessMentoringUi("stranger", capacityWith(0, 0)), false);
  });

  it("denies everyone when the allowlist is empty and capacity is zero", () => {
    delete process.env.MENTORING_UI_ALLOWLIST;
    assert.equal(canAccessMentoringUi("anyone", capacityWith(0, 0)), false);
  });

  it("does not treat MENTORING_DEBRIEF_ALLOWLIST as a way in", () => {
    delete process.env.MENTORING_UI_ALLOWLIST;
    const originalDebrief = process.env.MENTORING_DEBRIEF_ALLOWLIST;
    process.env.MENTORING_DEBRIEF_ALLOWLIST = "buyer";
    try {
      assert.equal(canAccessMentoringUi("buyer", capacityWith(0, 0)), false);
    } finally {
      if (originalDebrief === undefined) {
        delete process.env.MENTORING_DEBRIEF_ALLOWLIST;
      } else {
        process.env.MENTORING_DEBRIEF_ALLOWLIST = originalDebrief;
      }
    }
  });
});
