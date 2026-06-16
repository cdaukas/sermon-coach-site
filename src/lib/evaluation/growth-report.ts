import { getEvaluationById } from "./queries";
import { formatDisplayScoreBare } from "./display-score";
import { orderGrowthReportSnapshotsByDate } from "./growth-report-ordering";
import type { EvaluationResultStrict } from "./schema";
import type { EvaluationWithSermon } from "./types";

export {
  orderEvaluationIdsByCompletedAt,
  orderGrowthReportSnapshotsByDate,
} from "./growth-report-ordering";

export const MAX_QUOTE_PAIRS = 3;

export type GrowthReportEvaluationSnapshot = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  completedAt: string;
  result: EvaluationResultStrict;
};

export type GrowthReportData = {
  baseline: GrowthReportEvaluationSnapshot;
  current: GrowthReportEvaluationSnapshot;
  criterionDeltas: GrowthReportCriterionDelta[];
  headlines: GrowthReportHeadlines;
};

export type GrowthReportCriterionDelta = {
  id: number;
  name: string;
  category: number;
  score_a: number;
  score_b: number;
  delta: number;
  is_double_weighted: boolean;
};

export type GrowthReportHeadlines = {
  composite_weighted_a: number;
  composite_weighted_b: number;
  composite_weighted_delta: number;
  display_score_a: string;
  display_score_b: string;
  band_a: EvaluationResultStrict["scoring"]["band"];
  band_b: EvaluationResultStrict["scoring"]["band"];
};

export type CriterionScoreForPairing = {
  id: number;
  name: string;
  score: number;
  anchoredQuote: string | null;
  isDoubleWeighted: boolean;
};

export type QuotePairState = "pair" | "baseline_only" | "current_only";

export type QuotePair = {
  criterionId: number;
  criterionName: string;
  delta: number;
  isDoubleWeighted: boolean;
  baselineQuote: string | null;
  currentQuote: string | null;
  pairState: QuotePairState;
};

function toSnapshot(
  row: EvaluationWithSermon & {
    evaluation: { result: EvaluationResultStrict; completed_at: string | null };
  },
): GrowthReportEvaluationSnapshot {
  const completedAt = row.evaluation.completed_at;
  if (!completedAt) {
    throw new Error("Growth report requires a completed evaluation.");
  }

  return {
    evaluationId: row.evaluation.id,
    sermonId: row.sermon.id,
    sermonTitle: row.sermon.title,
    completedAt,
    result: row.evaluation.result,
  };
}

function isGrowthReportReady(
  row: EvaluationWithSermon | null,
): row is EvaluationWithSermon & {
  evaluation: {
    status: "complete";
    result: EvaluationResultStrict;
    completed_at: string;
  };
} {
  return (
    row != null &&
    row.evaluation.status === "complete" &&
    row.evaluation.result != null &&
    row.evaluation.completed_at != null
  );
}

export function buildCriterionDeltas(
  baseline: GrowthReportEvaluationSnapshot,
  current: GrowthReportEvaluationSnapshot,
): GrowthReportCriterionDelta[] {
  const baselineById = new Map(
    baseline.result.categories
      .flatMap((category) => category.criteria)
      .map((criterion) => [criterion.id, criterion]),
  );
  const currentById = new Map(
    current.result.categories
      .flatMap((category) => category.criteria)
      .map((criterion) => [criterion.id, criterion]),
  );

  const deltas: GrowthReportCriterionDelta[] = [];

  for (let id = 1; id <= 11; id++) {
    const scoreA = baselineById.get(id);
    const scoreB = currentById.get(id);
    if (!scoreA || !scoreB) {
      continue;
    }

    deltas.push({
      id,
      name: scoreA.name,
      category: scoreA.category,
      score_a: scoreA.score,
      score_b: scoreB.score,
      delta: scoreB.score - scoreA.score,
      is_double_weighted: scoreA.is_double_weighted,
    });
  }

  return deltas;
}

export function buildGrowthReportHeadlines(
  baseline: GrowthReportEvaluationSnapshot,
  current: GrowthReportEvaluationSnapshot,
): GrowthReportHeadlines {
  const composite_weighted_a = baseline.result.scoring.composite_weighted;
  const composite_weighted_b = current.result.scoring.composite_weighted;

  return {
    composite_weighted_a,
    composite_weighted_b,
    composite_weighted_delta: composite_weighted_b - composite_weighted_a,
    display_score_a: formatDisplayScoreBare(composite_weighted_a),
    display_score_b: formatDisplayScoreBare(composite_weighted_b),
    band_a: baseline.result.scoring.band,
    band_b: current.result.scoring.band,
  };
}

export function enrichGrowthReportData(data: {
  baseline: GrowthReportEvaluationSnapshot;
  current: GrowthReportEvaluationSnapshot;
}): GrowthReportData {
  return {
    ...data,
    criterionDeltas: buildCriterionDeltas(data.baseline, data.current),
    headlines: buildGrowthReportHeadlines(data.baseline, data.current),
  };
}

/** Loads full parsed evaluation results for a baseline/current pair. */
export async function loadGrowthReportData(
  baselineEvaluationId: string,
  currentEvaluationId: string,
): Promise<GrowthReportData | null> {
  if (baselineEvaluationId === currentEvaluationId) {
    return null;
  }

  const [baselineRow, currentRow] = await Promise.all([
    getEvaluationById(baselineEvaluationId),
    getEvaluationById(currentEvaluationId),
  ]);

  if (!isGrowthReportReady(baselineRow) || !isGrowthReportReady(currentRow)) {
    return null;
  }

  return enrichGrowthReportData(
    orderGrowthReportSnapshotsByDate(
      toSnapshot(baselineRow),
      toSnapshot(currentRow),
    ),
  );
}

function anchoredQuoteText(
  quote: { text: string } | null | undefined,
): string | null {
  const text = quote?.text?.trim();
  return text ? text : null;
}

/** Flattens result.categories into pairing rows with trimmed anchored_quote.text. */
export function flattenCriteriaForPairing(
  result: EvaluationResultStrict,
): CriterionScoreForPairing[] {
  return result.categories.flatMap((category) =>
    category.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      score: criterion.score,
      anchoredQuote: anchoredQuoteText(criterion.anchored_quote),
      isDoubleWeighted: criterion.is_double_weighted,
    })),
  );
}

/** Pairs anchored quotes on criteria that moved between baseline and current. */
export function buildQuotePairs(
  baseline: readonly CriterionScoreForPairing[],
  current: readonly CriterionScoreForPairing[],
  maxPairs: number = MAX_QUOTE_PAIRS,
): QuotePair[] {
  const baselineById = new Map(baseline.map((criterion) => [criterion.id, criterion]));
  const currentById = new Map(current.map((criterion) => [criterion.id, criterion]));
  const pairs: QuotePair[] = [];

  for (let id = 1; id <= 11; id++) {
    const baselineCriterion = baselineById.get(id);
    const currentCriterion = currentById.get(id);
    if (!baselineCriterion || !currentCriterion) {
      continue;
    }

    const delta = currentCriterion.score - baselineCriterion.score;
    if (delta === 0) {
      continue;
    }

    const baselineQuote = baselineCriterion.anchoredQuote;
    const currentQuote = currentCriterion.anchoredQuote;
    if (!baselineQuote && !currentQuote) {
      continue;
    }

    pairs.push({
      criterionId: id,
      criterionName: currentCriterion.name,
      delta,
      isDoubleWeighted: currentCriterion.isDoubleWeighted,
      baselineQuote,
      currentQuote,
      pairState:
        baselineQuote && currentQuote
          ? "pair"
          : baselineQuote
            ? "baseline_only"
            : "current_only",
    });
  }

  pairs.sort(
    (left, right) =>
      right.delta - left.delta ||
      Number(right.isDoubleWeighted) - Number(left.isDoubleWeighted),
  );

  return pairs.slice(0, maxPairs);
}

export function buildQuotePairsFromGrowthReport(
  data: GrowthReportData,
  maxPairs: number = MAX_QUOTE_PAIRS,
): QuotePair[] {
  return buildQuotePairs(
    flattenCriteriaForPairing(data.baseline.result),
    flattenCriteriaForPairing(data.current.result),
    maxPairs,
  );
}
