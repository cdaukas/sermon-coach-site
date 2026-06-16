import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  buildCriterionDeltas,
  buildGrowthReportHeadlines,
  buildQuotePairs,
  enrichGrowthReportData,
  flattenCriteriaForPairing,
  MAX_QUOTE_PAIRS,
  type CriterionScoreForPairing,
  type GrowthReportEvaluationSnapshot,
} from "./growth-report";
import {
  compareEvaluationChronology,
  orderEvaluationIdsByCompletedAt,
  orderGrowthReportSnapshotsByDate,
} from "./growth-report-ordering";
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

function makeSnapshot(
  evaluationId: string,
  completedAt: string,
  compositeWeighted: number,
  createdAt: string = completedAt,
): GrowthReportEvaluationSnapshot {
  const result = cloneFixture();
  result.scoring.composite_weighted = compositeWeighted;

  return {
    evaluationId,
    sermonId: `sermon-${evaluationId}`,
    sermonTitle: `Sermon ${evaluationId}`,
    completedAt,
    createdAt,
    result,
  };
}

describe("orderGrowthReportSnapshotsByDate", () => {
  it("places the earlier eval in baseline regardless of argument order", () => {
    const older = makeSnapshot("eval-older", "2025-01-01T12:00:00.000Z", 35);
    const newer = makeSnapshot("eval-newer", "2025-06-01T12:00:00.000Z", 39);

    const swapped = orderGrowthReportSnapshotsByDate(newer, older);
    assert.equal(swapped.baseline.evaluationId, "eval-older");
    assert.equal(swapped.current.evaluationId, "eval-newer");

    const natural = orderGrowthReportSnapshotsByDate(older, newer);
    assert.equal(natural.baseline.evaluationId, "eval-older");
    assert.equal(natural.current.evaluationId, "eval-newer");
  });

  it("orders same calendar day by full completedAt timestamp, not picker slot", () => {
    const earlierSameDay = makeSnapshot(
      "mission",
      "2026-06-11T02:46:26.271+00:00",
      42,
      "2026-06-11T02:44:59.23562+00:00",
    );
    const laterSameDay = makeSnapshot(
      "wait",
      "2026-06-11T02:53:47.39+00:00",
      39,
      "2026-06-11T02:52:16.322202+00:00",
    );

    const ordered = orderGrowthReportSnapshotsByDate(laterSameDay, earlierSameDay);
    assert.equal(ordered.baseline.evaluationId, "mission");
    assert.equal(ordered.current.evaluationId, "wait");

    const report = enrichGrowthReportData(ordered);
    assert.equal(report.headlines.composite_weighted_a, 42);
    assert.equal(report.headlines.composite_weighted_b, 39);
    assert.equal(report.headlines.composite_weighted_delta, -3);
  });
});

describe("orderEvaluationIdsByCompletedAt", () => {
  const options = [
    {
      evaluationId: "eval-older",
      completedAt: "2025-01-01T12:00:00.000Z",
    },
    {
      evaluationId: "eval-newer",
      completedAt: "2025-06-01T12:00:00.000Z",
    },
  ];

  it("returns earlier eval as baseline regardless of argument order", () => {
    const swapped = orderEvaluationIdsByCompletedAt(
      options,
      "eval-newer",
      "eval-older",
    );
    assert.equal(swapped.baselineEvaluationId, "eval-older");
    assert.equal(swapped.currentEvaluationId, "eval-newer");
  });

  it("orders same calendar day by full completedAt timestamp, not date label", () => {
    const sameDay = [
      {
        evaluationId: "eval-morning",
        completedAt: "2025-06-10T10:15:00.000Z",
        createdAt: "2025-06-10T09:00:00.000Z",
      },
      {
        evaluationId: "eval-evening",
        completedAt: "2025-06-10T20:45:00.000Z",
        createdAt: "2025-06-10T19:00:00.000Z",
      },
    ];

    const ordered = orderEvaluationIdsByCompletedAt(
      sameDay,
      "eval-evening",
      "eval-morning",
    );
    assert.equal(ordered.baselineEvaluationId, "eval-morning");
    assert.equal(ordered.currentEvaluationId, "eval-evening");
  });

  it("breaks identical completedAt ties with createdAt, then evaluationId", () => {
    const tiedCompletedAt = "2025-06-10T12:00:00.000Z";
    const earlierCreated = {
      evaluationId: "eval-b",
      completedAt: tiedCompletedAt,
      createdAt: "2025-06-10T11:00:00.000Z",
    };
    const laterCreated = {
      evaluationId: "eval-a",
      completedAt: tiedCompletedAt,
      createdAt: "2025-06-10T13:00:00.000Z",
    };

    assert.ok(
      compareEvaluationChronology(earlierCreated, laterCreated) < 0,
    );

    const ordered = orderEvaluationIdsByCompletedAt(
      [earlierCreated, laterCreated],
      laterCreated.evaluationId,
      earlierCreated.evaluationId,
    );
    assert.equal(ordered.baselineEvaluationId, "eval-b");
    assert.equal(ordered.currentEvaluationId, "eval-a");

    const lexTie = [
      {
        evaluationId: "eval-a",
        completedAt: tiedCompletedAt,
        createdAt: "2025-06-10T11:30:00.000Z",
      },
      {
        evaluationId: "eval-b",
        completedAt: tiedCompletedAt,
        createdAt: "2025-06-10T11:30:00.000Z",
      },
    ];
    assert.ok(compareEvaluationChronology(lexTie[0], lexTie[1]) < 0);
  });
});

describe("buildCriterionDeltas", () => {
  it("returns all 11 criteria with score_a, score_b, and delta from stored results", () => {
    const baselineResult = cloneFixture();
    const currentResult = cloneFixture();
    setCriterionScore(baselineResult, 3, 3);
    setCriterionScore(currentResult, 3, 5);
    setCriterionScore(baselineResult, 5, 4);
    setCriterionScore(currentResult, 5, 4);

    const baseline = makeSnapshot("eval-a", "2025-01-01T12:00:00.000Z", 35);
    const current = makeSnapshot("eval-b", "2025-06-01T12:00:00.000Z", 39);
    baseline.result = baselineResult;
    current.result = currentResult;

    const deltas = buildCriterionDeltas(baseline, current);

    assert.equal(deltas.length, 11);
    assert.deepEqual(
      deltas.map((row) => row.id),
      Array.from({ length: 11 }, (_, index) => index + 1),
    );

    const gospel = deltas.find((row) => row.id === 3);
    assert.equal(gospel?.score_a, 3);
    assert.equal(gospel?.score_b, 5);
    assert.equal(gospel?.delta, 2);
    assert.equal(gospel?.is_double_weighted, true);

    const structure = deltas.find((row) => row.id === 5);
    assert.equal(structure?.delta, 0);
  });
});

describe("buildGrowthReportHeadlines", () => {
  it("reads stored composite_weighted and formats display scores", () => {
    const baseline = makeSnapshot("eval-a", "2025-01-01T12:00:00.000Z", 37);
    const current = makeSnapshot("eval-b", "2025-06-01T12:00:00.000Z", 39);

    const headlines = buildGrowthReportHeadlines(baseline, current);

    assert.equal(headlines.composite_weighted_a, 37);
    assert.equal(headlines.composite_weighted_b, 39);
    assert.equal(headlines.composite_weighted_delta, 2);
    assert.equal(headlines.display_score_a, "6.7");
    assert.equal(headlines.display_score_b, "7.1");
    assert.equal(headlines.band_a, "Strong");
    assert.equal(headlines.band_b, "Strong");
  });
});

describe("enrichGrowthReportData", () => {
  it("attaches criterion deltas and headlines to ordered snapshots", () => {
    const older = makeSnapshot("eval-a", "2025-01-01T12:00:00.000Z", 37);
    const newer = makeSnapshot("eval-b", "2025-06-01T12:00:00.000Z", 39);

    const report = enrichGrowthReportData(
      orderGrowthReportSnapshotsByDate(newer, older),
    );

    assert.equal(report.baseline.evaluationId, "eval-a");
    assert.equal(report.current.evaluationId, "eval-b");
    assert.equal(report.criterionDeltas.length, 11);
    assert.equal(report.headlines.composite_weighted_delta, 2);
  });
});

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
