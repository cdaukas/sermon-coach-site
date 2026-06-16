import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  buildQuotePairs,
  flattenCriteriaForPairing,
  MAX_QUOTE_PAIRS,
  type CriterionScoreForPairing,
} from "./growth-report";
import type { EvaluationResultStrict } from "./schema";

function cloneFixture(): EvaluationResultStrict {
  return structuredClone(EVALUATION_FIXTURE);
}

function setCriterionScore(
  result: EvaluationResultStrict,
  id: number,
  score: number,
): void {
  for (const category of result.categories) {
    for (const criterion of category.criteria) {
      if (criterion.id === id) {
        criterion.score = score;
      }
    }
  }
}

function setCriterionQuote(
  result: EvaluationResultStrict,
  id: number,
  text: string | null,
): void {
  for (const category of result.categories) {
    for (const criterion of category.criteria) {
      if (criterion.id === id) {
        criterion.anchored_quote =
          text == null
            ? null
            : { text, approximate_location: "test" };
      }
    }
  }
}

describe("flattenCriteriaForPairing", () => {
  it("reads anchored_quote.text from result.categories", () => {
    const rows = flattenCriteriaForPairing(EVALUATION_FIXTURE);
    const gospel = rows.find((row) => row.id === 3);

    assert.ok(gospel);
    assert.equal(
      gospel.anchoredQuote,
      "Fall into the arms of the one who bore your sinful weakness all the way into the grave and back again.",
    );
    assert.equal(gospel.isDoubleWeighted, true);
  });

  it("treats blank anchored_quote.text as null", () => {
    const result = cloneFixture();
    setCriterionQuote(result, 3, "   ");

    const gospel = flattenCriteriaForPairing(result).find((row) => row.id === 3);
    assert.ok(gospel);
    assert.equal(gospel.anchoredQuote, null);
  });
});

describe("buildQuotePairs", () => {
  it("skips flat criteria and criteria with no quotes on either side", () => {
    const baseline = flattenCriteriaForPairing(EVALUATION_FIXTURE);
    const current = flattenCriteriaForPairing(EVALUATION_FIXTURE);

    assert.deepEqual(buildQuotePairs(baseline, current), []);
  });

  it("pairs quotes only when delta is non-zero", () => {
    const baseline = flattenCriteriaForPairing(EVALUATION_FIXTURE);
    const currentResult = cloneFixture();
    setCriterionScore(currentResult, 1, 5);
    const current = flattenCriteriaForPairing(currentResult);

    const pairs = buildQuotePairs(baseline, current);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0]?.criterionId, 1);
    assert.equal(pairs[0]?.delta, 1);
    assert.equal(pairs[0]?.pairState, "pair");
    assert.equal(
      pairs[0]?.baselineQuote,
      "Paul is not asking you to perform weakness — he is displaying what Christ's power looks like when strength is refused.",
    );
    assert.equal(
      pairs[0]?.currentQuote,
      "Paul is not asking you to perform weakness — he is displaying what Christ's power looks like when strength is refused.",
    );
  });

  it("marks baseline_only and current_only without fabricating missing halves", () => {
    const baselineResult = cloneFixture();
    const currentResult = cloneFixture();
    setCriterionScore(baselineResult, 3, 3);
    setCriterionScore(currentResult, 3, 4);
    setCriterionQuote(currentResult, 3, null);

    setCriterionScore(baselineResult, 6, 2);
    setCriterionScore(currentResult, 6, 3);
    setCriterionQuote(baselineResult, 6, null);

    const pairs = buildQuotePairs(
      flattenCriteriaForPairing(baselineResult),
      flattenCriteriaForPairing(currentResult),
    );

    const gospel = pairs.find((pair) => pair.criterionId === 3);
    const hardThings = pairs.find((pair) => pair.criterionId === 6);

    assert.equal(gospel?.pairState, "baseline_only");
    assert.equal(gospel?.currentQuote, null);
    assert.ok(gospel?.baselineQuote);

    assert.equal(hardThings?.pairState, "current_only");
    assert.equal(hardThings?.baselineQuote, null);
    assert.ok(hardThings?.currentQuote);
  });

  it("orders by biggest delta first, then double-weighted tie-break", () => {
    const baseline: CriterionScoreForPairing[] = [
      {
        id: 3,
        name: "Gospel clarity",
        score: 3,
        anchoredQuote: "baseline gospel",
        isDoubleWeighted: true,
      },
      {
        id: 5,
        name: "Structure",
        score: 3,
        anchoredQuote: "baseline structure",
        isDoubleWeighted: false,
      },
      {
        id: 7,
        name: "Application to present audience",
        score: 3,
        anchoredQuote: "baseline application",
        isDoubleWeighted: true,
      },
    ];
    const current: CriterionScoreForPairing[] = [
      {
        id: 3,
        name: "Gospel clarity",
        score: 4,
        anchoredQuote: "current gospel",
        isDoubleWeighted: true,
      },
      {
        id: 5,
        name: "Structure",
        score: 5,
        anchoredQuote: "current structure",
        isDoubleWeighted: false,
      },
      {
        id: 7,
        name: "Application to present audience",
        score: 4,
        anchoredQuote: "current application",
        isDoubleWeighted: true,
      },
    ];

    const pairs = buildQuotePairs(baseline, current);
    assert.deepEqual(
      pairs.map((pair) => pair.criterionId),
      [5, 3, 7],
    );
  });

  it(`caps output at ${MAX_QUOTE_PAIRS} movers by default`, () => {
    const baseline: CriterionScoreForPairing[] = [];
    const current: CriterionScoreForPairing[] = [];

    for (let id = 1; id <= 4; id++) {
      baseline.push({
        id,
        name: `Criterion ${id}`,
        score: 3,
        anchoredQuote: `baseline ${id}`,
        isDoubleWeighted: false,
      });
      current.push({
        id,
        name: `Criterion ${id}`,
        score: 3 + id,
        anchoredQuote: `current ${id}`,
        isDoubleWeighted: false,
      });
    }

    const pairs = buildQuotePairs(baseline, current);
    assert.equal(pairs.length, MAX_QUOTE_PAIRS);
    assert.deepEqual(
      pairs.map((pair) => pair.criterionId),
      [4, 3, 2],
    );
  });
});
