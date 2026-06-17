import type { EvaluationResultStrict } from "./schema";

export type FlatCriterion = {
  id: number;
  name: string;
  score: number;
  narrative: string;
  anchored_quote: { text: string; approximate_location: string } | null;
  is_double_weighted: boolean;
};

export type GrowthEdgeSelection = {
  criterion: FlatCriterion;
  priority: EvaluationResultStrict["top_priorities"][number];
};

export function flattenCriteria(
  result: EvaluationResultStrict,
): FlatCriterion[] {
  return result.categories.flatMap((category) =>
    category.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      score: criterion.score,
      narrative: criterion.narrative,
      anchored_quote: criterion.anchored_quote ?? null,
      is_double_weighted: criterion.is_double_weighted,
    })),
  );
}

/** Parses "Chapell · Fallen Condition Focus" → "Fallen Condition Focus". */
export function parseCriterionNameFromPrincipleTag(
  principleTag: string,
): string | null {
  const separatorIndex = principleTag.indexOf("·");
  if (separatorIndex === -1) {
    return null;
  }

  const name = principleTag.slice(separatorIndex + 1).trim();
  return name || null;
}

function findCriterionByName(
  criteria: FlatCriterion[],
  name: string,
): FlatCriterion | undefined {
  return criteria.find(
    (criterion) => criterion.name.toLowerCase() === name.toLowerCase(),
  );
}

function lowestScoringCriterion(
  criteria: FlatCriterion[],
): FlatCriterion {
  return criteria.reduce((lowest, current) => {
    if (current.score < lowest.score) {
      return current;
    }

    if (current.score === lowest.score && current.id < lowest.id) {
      return current;
    }

    return lowest;
  });
}

/**
 * Highest-leverage growth edge: top priority #1 (matches verdict.improvement),
 * resolved to its criterion via principle_tag; falls back to lowest score.
 */
export function selectGrowthCriterion(
  result: EvaluationResultStrict,
): GrowthEdgeSelection {
  const criteria = flattenCriteria(result);
  const priority = result.top_priorities.find((item) => item.rank === 1);

  if (!priority) {
    throw new Error("Evaluation is missing top priority #1.");
  }

  const taggedName = parseCriterionNameFromPrincipleTag(priority.principle_tag);
  const matched =
    taggedName != null ? findCriterionByName(criteria, taggedName) : undefined;

  return {
    priority,
    criterion: matched ?? lowestScoringCriterion(criteria),
  };
}
