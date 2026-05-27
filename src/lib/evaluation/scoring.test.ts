import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVALUATION_FIXTURE } from "./fixture";
import { VERDICT_STRICT_CAPS_FROM } from "./prompt";
import {
  applyComputedScoring,
  compositeWeightedFromWeightedRaw,
  computeScoringFromCategories,
  DOUBLE_WEIGHTED_CRITERION_IDS,
  doubleWeightedBonus,
  evaluationResultStrictSchema,
  evaluationVerdictPersistSchema,
  isDoubleWeightedCriterion,
  promptVersionAtLeast,
  SCORING_RAW_MAX,
  sumCriterionScores,
  usesVerdictReadGrandfather,
  WEIGHTED_RAW_MAX,
} from "./schema";

describe("prompt_version verdict cap gate", () => {
  it("promptVersionAtLeast compares v2.x segments", () => {
    assert.equal(promptVersionAtLeast("v2.3", "v2.3"), true);
    assert.equal(promptVersionAtLeast("v2.4", "v2.3"), true);
    assert.equal(promptVersionAtLeast("v2.2", "v2.3"), false);
    assert.equal(promptVersionAtLeast("v2", "v2.3"), false);
    assert.equal(promptVersionAtLeast("v3", "v2.3"), true);
  });

  it("usesVerdictReadGrandfather for v2–v2.2 and fixture-*", () => {
    assert.equal(usesVerdictReadGrandfather("v2"), true);
    assert.equal(usesVerdictReadGrandfather("v2.1"), true);
    assert.equal(usesVerdictReadGrandfather("v2.2"), true);
    assert.equal(usesVerdictReadGrandfather("fixture-v1"), true);
    assert.equal(usesVerdictReadGrandfather(null), true);
    assert.equal(usesVerdictReadGrandfather("v2.3"), false);
    assert.equal(
      usesVerdictReadGrandfather(VERDICT_STRICT_CAPS_FROM),
      false,
    );
  });

  it("evaluationVerdictPersistSchema rejects affirmation over 60 words", () => {
    const longAffirmation = Array.from({ length: 61 }, (_, i) => `word${i}`).join(
      " ",
    );
    const parsed = evaluationVerdictPersistSchema.safeParse({
      affirmation: longAffirmation,
      improvement: "The single highest-leverage change for the next sermon: tighten application.",
    });
    assert.equal(parsed.success, false);
  });
});

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

describe("computeScoringFromCategories", () => {
  it("matches fixture criterion sum and weighted composite", () => {
    const scoring = computeScoringFromCategories(EVALUATION_FIXTURE.categories);
    assert.equal(sumCriterionScores(EVALUATION_FIXTURE.categories), 40);
    assert.equal(scoring.raw_total, 40);
    assert.equal(scoring.composite_simple, 40);
    assert.equal(scoring.composite_weighted, 39);
    assert.equal(scoring.band, "Strong");
  });

  it("corrects Linger-shaped model scoring (sum 46, model claimed 43/42)", () => {
    const lingerScores = [4, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4];
    const categories = EVALUATION_FIXTURE.categories.map((cat, catIndex) => ({
      ...cat,
      criteria: cat.criteria.map((c, i) => {
        const globalIndex =
          catIndex === 0 ? i : catIndex === 1 ? 3 + i : catIndex === 2 ? 6 + i : 9 + i;
        return { ...c, score: lingerScores[globalIndex] ?? c.score };
      }),
    })) as typeof EVALUATION_FIXTURE.categories;

    const scoring = computeScoringFromCategories(categories);
    assert.equal(sumCriterionScores(categories), 46);
    assert.equal(scoring.raw_total, 46);
    assert.equal(scoring.composite_weighted, 46);
    assert.equal(scoring.band, "Strong");
  });

  it("applyComputedScoring passes strict schema after wrong model scoring", () => {
    const wrong = {
      ...EVALUATION_FIXTURE,
      scoring: {
        band: "Strong" as const,
        raw_max: 55 as const,
        raw_total: 43,
        composite_simple: 43,
        composite_weighted: 42,
      },
    };
    const lingerScores = [4, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4];
    const categories = EVALUATION_FIXTURE.categories.map((cat, catIndex) => ({
      ...cat,
      criteria: cat.criteria.map((c, i) => {
        const globalIndex =
          catIndex === 0 ? i : catIndex === 1 ? 3 + i : catIndex === 2 ? 6 + i : 9 + i;
        return { ...c, score: lingerScores[globalIndex] ?? c.score };
      }),
    })) as typeof EVALUATION_FIXTURE.categories;

    const recomputed = applyComputedScoring({ ...wrong, categories });
    assert.equal(evaluationResultStrictSchema.safeParse(recomputed).success, true);
    assert.equal(recomputed.scoring.raw_total, 46);
  });
});
