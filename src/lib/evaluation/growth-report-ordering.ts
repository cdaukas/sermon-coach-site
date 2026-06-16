export type ChronologicalEvaluationRef = {
  evaluationId: string;
  completedAt: string;
  createdAt?: string;
};

/** Full ISO timestamptz comparison; createdAt, then evaluationId as stable tie-breakers. */
export function compareEvaluationChronology(
  left: ChronologicalEvaluationRef,
  right: ChronologicalEvaluationRef,
): number {
  const leftCompleted = Date.parse(left.completedAt);
  const rightCompleted = Date.parse(right.completedAt);

  if (leftCompleted !== rightCompleted) {
    return leftCompleted - rightCompleted;
  }

  if (left.createdAt && right.createdAt) {
    const leftCreated = Date.parse(left.createdAt);
    const rightCreated = Date.parse(right.createdAt);
    if (leftCreated !== rightCreated) {
      return leftCreated - rightCreated;
    }
  }

  return left.evaluationId.localeCompare(right.evaluationId);
}

/** Maps two evaluation picks to chronological baseline (earlier) and current (later) IDs. */
export function orderEvaluationIdsByCompletedAt(
  options: ChronologicalEvaluationRef[],
  firstEvaluationId: string,
  secondEvaluationId: string,
): { baselineEvaluationId: string; currentEvaluationId: string } {
  const first = options.find((option) => option.evaluationId === firstEvaluationId);
  const second = options.find((option) => option.evaluationId === secondEvaluationId);

  if (!first || !second) {
    return {
      baselineEvaluationId: firstEvaluationId,
      currentEvaluationId: secondEvaluationId,
    };
  }

  if (compareEvaluationChronology(first, second) <= 0) {
    return {
      baselineEvaluationId: firstEvaluationId,
      currentEvaluationId: secondEvaluationId,
    };
  }

  return {
    baselineEvaluationId: secondEvaluationId,
    currentEvaluationId: firstEvaluationId,
  };
}

/** Assign earlier completedAt to baseline (A), later to current (B). */
export function orderGrowthReportSnapshotsByDate<T extends ChronologicalEvaluationRef>(
  first: T,
  second: T,
): { baseline: T; current: T } {
  if (compareEvaluationChronology(first, second) <= 0) {
    return { baseline: first, current: second };
  }

  return { baseline: second, current: first };
}
