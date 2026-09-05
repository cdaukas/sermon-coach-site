/** Prep card measure ids and pool membership. */

export const PREP_MEASURE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export type PrepMeasureId = (typeof PREP_MEASURE_IDS)[number];

/** Actionable seven — eligible for strengths and focus. */
export const ACTIONABLE_MEASURE_IDS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Strengths-only five — top of card only, never focus. */
export const STRENGTHS_ONLY_MEASURE_IDS = [8, 9, 10, 11, 12] as const;

/**
 * Measures with a live counter in this ship.
 * 6 is defined but returns null (spaCy not approximated).
 * 1, 8, 10, 11 have no counter yet.
 * 9 and 12 are strengths-only.
 */
export const COMPUTED_MEASURE_IDS = [2, 3, 4, 5, 7, 9, 12] as const;

export type ComputedPrepMeasureId = (typeof COMPUTED_MEASURE_IDS)[number];

/** Table order is the tiebreak (lower id = more evidence). */
export function measureTiebreakRank(id: PrepMeasureId): number {
  return id;
}

export function isActionableMeasure(id: PrepMeasureId): boolean {
  return (ACTIONABLE_MEASURE_IDS as readonly number[]).includes(id);
}

export function isComputedMeasure(id: PrepMeasureId): boolean {
  return (COMPUTED_MEASURE_IDS as readonly number[]).includes(id);
}
