import {
  isActionableMeasure,
  measureTiebreakRank,
  type PrepMeasureId,
} from "./measures";
import type {
  PrepCardSelection,
  PrepMeasureCount,
  PrepRankedMeasure,
} from "./types";

const MIN_SERMONS_FOR_FULL_THREE = 10;
const TARGET_EACH_END = 3;

function rateOf(count: PrepMeasureCount): number | null {
  if (
    count.hits == null ||
    count.eligible == null ||
    count.eligible <= 0 ||
    count.rate == null
  ) {
    return null;
  }
  return count.rate;
}

function toRanked(count: PrepMeasureCount): PrepRankedMeasure | null {
  const rate = rateOf(count);
  if (rate == null || count.hits == null || count.eligible == null) {
    return null;
  }
  return {
    id: count.id,
    rate,
    hits: count.hits,
    eligible: count.eligible,
  };
}

function compareAscending(a: PrepRankedMeasure, b: PrepRankedMeasure): number {
  if (a.rate !== b.rate) {
    return a.rate - b.rate;
  }
  return measureTiebreakRank(a.id) - measureTiebreakRank(b.id);
}

function compareDescending(a: PrepRankedMeasure, b: PrepRankedMeasure): number {
  if (a.rate !== b.rate) {
    return b.rate - a.rate;
  }
  return measureTiebreakRank(a.id) - measureTiebreakRank(b.id);
}

export type RankPrepCardOptions = {
  /** Sermons in the sample (not measure count). */
  sampleSize: number;
  targetEachEnd?: number;
  minSermonsForFullThree?: number;
};

/**
 * Rank a preacher against himself.
 * Strengths: top N from every countable measure in `counts`.
 * Focus: bottom N from actionable measures only.
 * Nothing at both ends: overlap stays a strength; next-lowest focus promoted.
 */
export function rankPrepCard(
  counts: readonly PrepMeasureCount[],
  options: RankPrepCardOptions,
): PrepCardSelection {
  const target = options.targetEachEnd ?? TARGET_EACH_END;
  const minSermons =
    options.minSermonsForFullThree ?? MIN_SERMONS_FOR_FULL_THREE;

  const rankedAll = counts
    .map(toRanked)
    .filter((row): row is PrepRankedMeasure => row !== null);

  const rankedActionable = rankedAll.filter((row) =>
    isActionableMeasure(row.id),
  );

  let take = target;
  if (options.sampleSize < minSermons) {
    take = Math.min(target, Math.max(1, Math.floor(options.sampleSize / 4)));
    if (options.sampleSize < 3) {
      take = Math.min(take, 1);
    }
  }
  take = Math.min(take, rankedAll.length, rankedActionable.length || rankedAll.length);

  const strengths = [...rankedAll].sort(compareDescending).slice(0, take);
  const strengthIds = new Set(strengths.map((row) => row.id));

  const focusOrdered = [...rankedActionable].sort(compareAscending);
  const focus: PrepRankedMeasure[] = [];
  for (const row of focusOrdered) {
    if (focus.length >= take) {
      break;
    }
    if (strengthIds.has(row.id)) {
      continue;
    }
    focus.push(row);
  }

  return { strengths, focus };
}

export function emptyCountsForIds(
  ids: readonly PrepMeasureId[],
): PrepMeasureCount[] {
  return ids.map((id) => ({
    id,
    hits: null,
    eligible: null,
    rate: null,
  }));
}
