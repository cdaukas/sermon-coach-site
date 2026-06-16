import { getEvaluationById } from "./queries";
import type { EvaluationResultStrict } from "./schema";
import type { EvaluationWithSermon } from "./types";

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

  return {
    baseline: toSnapshot(baselineRow),
    current: toSnapshot(currentRow),
  };
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
