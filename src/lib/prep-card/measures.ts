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
 * 1 = Theme 2 C1 Christ agency in prose (UDPipe).
 * 6 = Theme 2 C2 Christ in a main point (UDPipe).
 * 10 has no counter yet.
 * 8 = C3 cross named object; 11 = C4 gospel in skeleton; 9 and 12 strengths-only.
 */
export const COMPUTED_MEASURE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12,
] as const;

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
