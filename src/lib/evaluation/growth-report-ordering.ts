/** Maps two evaluation picks to chronological baseline (earlier) and current (later) IDs. */
export function orderEvaluationIdsByCompletedAt(
  options: { evaluationId: string; completedAt: string }[],
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

  if (Date.parse(first.completedAt) <= Date.parse(second.completedAt)) {
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
export function orderGrowthReportSnapshotsByDate<T extends { completedAt: string }>(
  first: T,
  second: T,
): { baseline: T; current: T } {
  const firstTime = Date.parse(first.completedAt);
  const secondTime = Date.parse(second.completedAt);

  if (firstTime <= secondTime) {
    return { baseline: first, current: second };
  }

  return { baseline: second, current: first };
}
