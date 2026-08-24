import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  buildGrowthTrendSeries,
  directionCopyForSeries,
  evaluationIsValidForGrowth,
  type GrowthTrendRollingPoint,
  type GrowthTrendSourceRow,
} from "./growth-trend";
import {
  clampScoreToPlot,
  isMaterialPromptBoundary,
} from "./growth-trend-plot";
import { applyComputedScoring } from "./schema";
import type { EvaluationResultStrict } from "./schema";

function validResult(): EvaluationResultStrict {
  return structuredClone(EVALUATION_FIXTURE);
}

function allOnesResult(): EvaluationResultStrict {
  const result = structuredClone(EVALUATION_FIXTURE);
  for (const category of result.categories) {
    for (const criterion of category.criteria) {
      criterion.score = 1;
    }
  }
  return applyComputedScoring(result);
}

function sourceRow(
  overrides: Partial<GrowthTrendSourceRow> &
    Pick<GrowthTrendSourceRow, "evaluationId" | "sermonId">,
): GrowthTrendSourceRow {
  const result = overrides.result ?? validResult();
  return {
    sermonTitle: overrides.sermonTitle ?? `Sermon ${overrides.sermonId}`,
    completedAt: overrides.completedAt ?? "2026-01-01T12:00:00.000Z",
    createdAt: overrides.createdAt ?? overrides.completedAt ?? "2026-01-01T12:00:00.000Z",
    overallScore: overrides.overallScore ?? 39,
    promptVersion: overrides.promptVersion ?? "v3.5",
    excludedFromGrowth: overrides.excludedFromGrowth ?? false,
    result,
    evaluationId: overrides.evaluationId,
    sermonId: overrides.sermonId,
  };
}

describe("evaluationIsValidForGrowth", () => {
  it("accepts a parsed fixture and eleven legal 1s", () => {
    assert.equal(
      evaluationIsValidForGrowth(validResult(), "v3.5", "eval-ok"),
      true,
    );
    const ones = allOnesResult();
    assert.equal(ones.scoring.composite_weighted, 11);
    assert.equal(
      evaluationIsValidForGrowth(ones, "v3.5", "eval-ones"),
      true,
    );
  });

  it("rejects parse failure, missing composite, and thin criteria", () => {
    assert.equal(
      evaluationIsValidForGrowth({ broken: true }, "v3.5", "eval-bad"),
      false,
    );
    const missingComposite = {
      ...structuredClone(EVALUATION_FIXTURE),
      scoring: {
        ...EVALUATION_FIXTURE.scoring,
        composite_weighted: null,
      },
    };
    assert.equal(
      evaluationIsValidForGrowth(missingComposite, "v3.5", "eval-null"),
      false,
    );
    const thin = {
      ...structuredClone(EVALUATION_FIXTURE),
      categories: [EVALUATION_FIXTURE.categories[0]],
    };
    assert.equal(
      evaluationIsValidForGrowth(thin, "v3.5", "eval-thin"),
      false,
    );
  });
});

describe("buildGrowthTrendSeries", () => {
  it("collapses four evaluations on one sermon to the latest created_at", () => {
    const rows = [
      sourceRow({
        evaluationId: "e1",
        sermonId: "s1",
        createdAt: "2026-01-01T10:00:00.000Z",
        completedAt: "2026-01-01T10:00:00.000Z",
        overallScore: 33,
      }),
      sourceRow({
        evaluationId: "e2",
        sermonId: "s1",
        createdAt: "2026-01-02T10:00:00.000Z",
        completedAt: "2026-01-02T10:00:00.000Z",
        overallScore: 40,
      }),
      sourceRow({
        evaluationId: "e3",
        sermonId: "s1",
        createdAt: "2026-01-04T10:00:00.000Z",
        completedAt: "2026-01-03T10:00:00.000Z",
        overallScore: 44,
      }),
      sourceRow({
        evaluationId: "e4",
        sermonId: "s1",
        createdAt: "2026-01-03T10:00:00.000Z",
        completedAt: "2026-01-05T10:00:00.000Z",
        overallScore: 36,
      }),
    ];
    const series = buildGrowthTrendSeries(rows);
    assert.equal(series.includedSermonCount, 1);
    assert.equal(series.includedSermons[0].evaluationId, "e3");
    assert.equal(series.includedSermons[0].overallScore, 44);
  });

  it("drops malformed rows and keeps a real 11/55", () => {
    const ones = allOnesResult();
    const series = buildGrowthTrendSeries([
      sourceRow({
        evaluationId: "bad",
        sermonId: "s-bad",
        result: { not: "an evaluation" },
      }),
      sourceRow({
        evaluationId: "ones",
        sermonId: "s-ones",
        overallScore: 11,
        result: ones,
      }),
    ]);
    assert.equal(series.includedSermonCount, 1);
    assert.equal(series.includedSermons[0].evaluationId, "ones");
    assert.equal(series.includedSermons[0].overallScore, 11);
  });

  it("counts user exclusions separately and omits them from the line", () => {
    const series = buildGrowthTrendSeries([
      sourceRow({ evaluationId: "keep", sermonId: "s-keep" }),
      sourceRow({
        evaluationId: "skip",
        sermonId: "s-skip",
        excludedFromGrowth: true,
      }),
    ]);
    assert.equal(series.includedSermonCount, 1);
    assert.equal(series.excludedSermonCount, 1);
    assert.equal(
      series.sampleLine,
      "Across 1 sermons. 1 excluded by you.",
    );
  });

  it("builds rolling means and withholds the line under six sermons", () => {
    const five = Array.from({ length: 5 }, (_, index) =>
      sourceRow({
        evaluationId: `e${index}`,
        sermonId: `s${index}`,
        completedAt: `2026-02-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-02-0${index + 1}T12:00:00.000Z`,
        overallScore: 40 + index,
      }),
    );
    const sparse = buildGrowthTrendSeries(five);
    assert.equal(sparse.showLine, false);
    assert.equal(sparse.rollingPoints.length, 0);
    assert.equal(
      sparse.directionCopy,
      "Your trend line starts at six sermons. You have 5 so far.",
    );

    const six = [
      ...five,
      sourceRow({
        evaluationId: "e5",
        sermonId: "s5",
        completedAt: "2026-02-06T12:00:00.000Z",
        createdAt: "2026-02-06T12:00:00.000Z",
        overallScore: 45,
      }),
    ];
    const ready = buildGrowthTrendSeries(six);
    assert.equal(ready.showLine, true);
    assert.equal(ready.showStatPair, false);
    assert.equal(ready.rollingPoints.length, 3);
    assert.equal(ready.rollingPoints[0].rollingMean, (40 + 41 + 42 + 43) / 4);
  });

  it("shows disjoint first/latest four stats at eight sermons", () => {
    const rows = Array.from({ length: 8 }, (_, index) =>
      sourceRow({
        evaluationId: `e${index}`,
        sermonId: `s${index}`,
        completedAt: `2026-03-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-03-0${index + 1}T12:00:00.000Z`,
        overallScore: 32 + index,
      }),
    );
    const series = buildGrowthTrendSeries(rows);
    assert.equal(series.showStatPair, true);
    assert.notEqual(series.firstFourDisplay, series.latestFourDisplay);
  });

  it("holds direction copy under the 0.6 display floor", () => {
    const rows = Array.from({ length: 6 }, (_, index) =>
      sourceRow({
        evaluationId: `e${index}`,
        sermonId: `s${index}`,
        completedAt: `2026-04-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-04-0${index + 1}T12:00:00.000Z`,
        overallScore: 40,
      }),
    );
    const series = buildGrowthTrendSeries(rows);
    assert.match(series.directionCopy, /^Holding steady/);
  });

  it("compares first-half and second-half rolling means, not endpoints", () => {
    const sermons = Array.from({ length: 6 }, (_, index) =>
      sourceRow({
        evaluationId: `e${index}`,
        sermonId: `s${index}`,
        completedAt: `2026-05-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-05-0${index + 1}T12:00:00.000Z`,
        overallScore: 40,
      }),
    );
    const rolling: GrowthTrendRollingPoint[] = [
      { ...sermons[0], rollingMean: 50 },
      { ...sermons[1], rollingMean: 30 },
      { ...sermons[2], rollingMean: 40 },
      { ...sermons[3], rollingMean: 48 },
      { ...sermons[4], rollingMean: 45 },
    ];
    const copy = directionCopyForSeries(sermons, rolling);
    assert.match(copy, /^Up /);
    assert.doesNotMatch(copy, /^Down /);
  });
});

describe("plot helpers", () => {
  it("clamps scores below 30 to the plot floor", () => {
    assert.equal(clampScoreToPlot(11), 30);
    assert.equal(clampScoreToPlot(55), 55);
    assert.equal(clampScoreToPlot(40), 40);
  });

  it("marks only the v3.2 to v3.3 boundary", () => {
    assert.equal(isMaterialPromptBoundary("v3.2", "v3.3"), true);
    assert.equal(isMaterialPromptBoundary("v3.1", "v3.2"), false);
    assert.equal(isMaterialPromptBoundary("v3.3", "v3.4"), false);
    assert.equal(isMaterialPromptBoundary("v3.4", "v3.5"), false);
  });
});
