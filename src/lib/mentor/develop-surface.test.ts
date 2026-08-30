import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import { mentoringDevelopSurface } from "./develop-surface";

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

describe("mentoringDevelopSurface", () => {
  it("treats a failed fetch as error, not purchase", () => {
    assert.equal(mentoringDevelopSurface(null), "error");
  });

  it("sells seats only when both types are zero", () => {
    assert.equal(mentoringDevelopSurface(capacityWith(0, 0)), "purchase");
  });

  it("keeps the workspace when either type has capacity", () => {
    assert.equal(mentoringDevelopSurface(capacityWith(1, 0)), "workspace");
    assert.equal(mentoringDevelopSurface(capacityWith(0, 1)), "workspace");
  });
});
