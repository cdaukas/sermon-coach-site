import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compositeWeightedFromWeightedRaw,
  DOUBLE_WEIGHTED_CRITERION_IDS,
  doubleWeightedBonus,
  isDoubleWeightedCriterion,
  SCORING_RAW_MAX,
  WEIGHTED_RAW_MAX,
} from "./schema";

describe("double-weighted criterion set (3, 4, 7)", () => {
  it("locks the SCHEMA_SPEC load-bearing ids", () => {
    assert.deepEqual(
      [...DOUBLE_WEIGHTED_CRITERION_IDS].sort((a, b) => a - b),
      [3, 4, 7],
    );
  });

  it("isDoubleWeightedCriterion matches the set", () => {
    for (let id = 1; id <= 11; id++) {
      assert.equal(
        isDoubleWeightedCriterion(id),
        DOUBLE_WEIGHTED_CRITERION_IDS.has(id),
      );
    }
  });

  it("doubleWeightedBonus sums only #3, #4, #7", () => {
    const scores: Record<number, number> = {
      1: 4,
      2: 5,
      3: 4,
      4: 5,
      5: 4,
      6: 4,
      7: 4,
      8: 4,
      9: 4,
      10: 4,
      11: 4,
    };
    assert.equal(doubleWeightedBonus(scores), 4 + 5 + 4);
  });

  it("compositeWeightedFromWeightedRaw uses 55/70 scale", () => {
    assert.equal(compositeWeightedFromWeightedRaw(59), 46);
    assert.equal(SCORING_RAW_MAX, 55);
    assert.equal(WEIGHTED_RAW_MAX, 70);
  });
});
