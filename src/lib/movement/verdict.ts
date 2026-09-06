/**
 * Movement verdicts. Provisional thresholds from the movement-report spec.
 * Marked provisional until the norms run (parked on privacy).
 *
 * Moved / slipped: rate changed by ≥ 1/3 of baseline rate AND ≥ 3 sermons
 * absolute. Both required. Held: anything smaller.
 */

export type MovementVerdict = "moved" | "held" | "slipped";

/** Absolute sermon delta required (provisional). */
export const MOVEMENT_ABS_SERMONS = 3;

/** Fraction of baseline rate required (provisional). */
export const MOVEMENT_RATE_FRACTION = 1 / 3;

export type CountPair = {
  baselineHits: number;
  baselineEligible: number;
  comparisonHits: number;
  comparisonEligible: number;
};

export function rateOf(hits: number, eligible: number): number | null {
  if (eligible <= 0) {
    return null;
  }
  return hits / eligible;
}

/**
 * Expected hits in the comparison sample at the baseline rate.
 * Absolute movement is |comparisonHits - expected|.
 */
export function absoluteSermonDelta(pair: CountPair): number | null {
  const baselineRate = rateOf(pair.baselineHits, pair.baselineEligible);
  if (baselineRate == null || pair.comparisonEligible <= 0) {
    return null;
  }
  const expected = baselineRate * pair.comparisonEligible;
  return Math.abs(pair.comparisonHits - expected);
}

export function rateDelta(pair: CountPair): number | null {
  const a = rateOf(pair.baselineHits, pair.baselineEligible);
  const b = rateOf(pair.comparisonHits, pair.comparisonEligible);
  if (a == null || b == null) {
    return null;
  }
  return b - a;
}

/**
 * Verdict for one discipline. Returns held when either sample is empty.
 */
export function computeMovementVerdict(pair: CountPair): MovementVerdict {
  const baselineRate = rateOf(pair.baselineHits, pair.baselineEligible);
  const comparisonRate = rateOf(
    pair.comparisonHits,
    pair.comparisonEligible,
  );
  if (baselineRate == null || comparisonRate == null) {
    return "held";
  }

  const deltaRate = comparisonRate - baselineRate;
  const rateThreshold = Math.abs(baselineRate) * MOVEMENT_RATE_FRACTION;
  // When baseline rate is 0, a third of zero is zero — require any positive
  // rate change plus the absolute sermon floor so 0→1 cannot clear alone.
  const clearsRate =
    baselineRate === 0
      ? Math.abs(deltaRate) > 0
      : Math.abs(deltaRate) >= rateThreshold;

  const abs = absoluteSermonDelta(pair);
  const clearsAbs = abs != null && abs >= MOVEMENT_ABS_SERMONS;

  if (!clearsRate || !clearsAbs) {
    return "held";
  }
  return deltaRate > 0 ? "moved" : "slipped";
}
