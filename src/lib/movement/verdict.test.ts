import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  absoluteSermonDelta,
  computeMovementVerdict,
  rateOf,
} from "./verdict";

describe("computeMovementVerdict", () => {
  it("marks moved when rate and absolute floors both clear", () => {
    // 2/24 → 6/13: rate 0.083 → 0.462; expected at baseline ≈ 1.08; abs ≈ 4.9
    assert.equal(
      computeMovementVerdict({
        baselineHits: 2,
        baselineEligible: 24,
        comparisonHits: 6,
        comparisonEligible: 13,
      }),
      "moved",
    );
  });

  it("holds when a third of rate clears but absolute sermons do not", () => {
    // 1/24 → 2/13: clears a third of rate, absolute ≈ 1.5 sermons
    assert.equal(
      computeMovementVerdict({
        baselineHits: 1,
        baselineEligible: 24,
        comparisonHits: 2,
        comparisonEligible: 13,
      }),
      "held",
    );
  });

  it("holds a flat rate across unequal samples", () => {
    assert.equal(
      computeMovementVerdict({
        baselineHits: 5,
        baselineEligible: 24,
        comparisonHits: 5,
        comparisonEligible: 13,
      }),
      "held",
    );
  });

  it("marks slipped on a clear drop", () => {
    // 12/24 → 2/13: rate 0.5 → 0.15; expected 6.5; abs ≈ 4.5
    assert.equal(
      computeMovementVerdict({
        baselineHits: 12,
        baselineEligible: 24,
        comparisonHits: 2,
        comparisonEligible: 13,
      }),
      "slipped",
    );
  });

  it("holds when either sample is empty", () => {
    assert.equal(
      computeMovementVerdict({
        baselineHits: 2,
        baselineEligible: 0,
        comparisonHits: 6,
        comparisonEligible: 13,
      }),
      "held",
    );
  });
});

describe("rateOf / absoluteSermonDelta", () => {
  it("computes rates and absolute expected deltas", () => {
    assert.equal(rateOf(2, 24), 2 / 24);
    const abs = absoluteSermonDelta({
      baselineHits: 2,
      baselineEligible: 24,
      comparisonHits: 6,
      comparisonEligible: 13,
    });
    assert.ok(abs != null && abs > 3);
  });
});
