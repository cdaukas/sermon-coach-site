import { toDisplayScore } from "./display-score";
import { compareEvaluationChronology } from "./growth-report-ordering";
import { parseEvaluationResult } from "./schema";

export {
  clampScoreToPlot,
  GROWTH_PLOT_CEILING,
  GROWTH_PLOT_FLOOR,
  isMaterialPromptBoundary,
  MATERIAL_PROMPT_BOUNDARIES,
} from "./growth-trend-plot";

export const GROWTH_ROLLING_WINDOW = 4;
export const GROWTH_LINE_MIN_SERMONS = 6;
export const GROWTH_STAT_PAIR_MIN_SERMONS = 8;
export const GROWTH_CHART_POINT_LIMIT = 24;
export const GROWTH_DIRECTION_FLOOR = 0.6;

/**
 * One sermon, one growth point: latest valid diagnostic by created_at.
 *
 * Known edge, not fixed here: evaluations carry owner_id, sermons carry
 * user_id. A mentor evaluating a mentee's sermon owns the evaluation and not
 * the sermon, so a sermon-level excluded_from_growth flag cannot remove that
 * run from the mentor's own line. Small now; real once Develop Others has volume.
 */
export type GrowthTrendSourceRow = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  completedAt: string;
  createdAt: string;
  overallScore: number;
  promptVersion: string;
  excludedFromGrowth: boolean;
  result: unknown;
};

export type GrowthTrendSermonPoint = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  completedAt: string;
  createdAt: string;
  overallScore: number;
  promptVersion: string;
};

export type GrowthTrendRollingPoint = GrowthTrendSermonPoint & {
  rollingMean: number;
};

export type GrowthTrendSeries = {
  includedSermonCount: number;
  excludedSermonCount: number;
  includedSermons: GrowthTrendSermonPoint[];
  rollingPoints: GrowthTrendRollingPoint[];
  showLine: boolean;
  showStatPair: boolean;
  firstFourDisplay: number | null;
  latestFourDisplay: number | null;
  sampleLine: string;
  directionCopy: string;
};

export function evaluationIsValidForGrowth(
  result: unknown,
  promptVersion: string,
  evaluationId: string,
): boolean {
  const parsed = parseEvaluationResult(result, {
    promptVersion,
    evaluationId,
  });
  if (parsed == null) {
    return false;
  }

  const criteria = parsed.categories.flatMap((category) => category.criteria);
  if (criteria.length < 11) {
    return false;
  }

  for (const criterion of criteria) {
    if (
      typeof criterion.score !== "number" ||
      !Number.isInteger(criterion.score) ||
      criterion.score < 1 ||
      criterion.score > 5
    ) {
      return false;
    }
  }

  if (
    parsed.scoring.composite_weighted == null ||
    typeof parsed.scoring.composite_weighted !== "number"
  ) {
    return false;
  }

  return true;
}

function chronologyRef(row: {
  evaluationId: string;
  completedAt: string;
  createdAt: string;
}) {
  return {
    evaluationId: row.evaluationId,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
  };
}

function preferLaterCreated(
  current: GrowthTrendSourceRow,
  candidate: GrowthTrendSourceRow,
): GrowthTrendSourceRow {
  const createdDelta =
    Date.parse(candidate.createdAt) - Date.parse(current.createdAt);
  if (createdDelta !== 0) {
    return createdDelta > 0 ? candidate : current;
  }
  return compareEvaluationChronology(
    chronologyRef(candidate),
    chronologyRef(current),
  ) > 0
    ? candidate
    : current;
}

export function collapseToLatestValidSermon(
  rows: readonly GrowthTrendSourceRow[],
): {
  includedSermons: GrowthTrendSermonPoint[];
  excludedSermonCount: number;
} {
  const excludedSermonIds = new Set<string>();
  const latestBySermon = new Map<string, GrowthTrendSourceRow>();

  for (const row of rows) {
    if (row.excludedFromGrowth) {
      excludedSermonIds.add(row.sermonId);
      continue;
    }

    if (
      !evaluationIsValidForGrowth(
        row.result,
        row.promptVersion,
        row.evaluationId,
      )
    ) {
      continue;
    }

    const existing = latestBySermon.get(row.sermonId);
    latestBySermon.set(
      row.sermonId,
      existing ? preferLaterCreated(existing, row) : row,
    );
  }

  const includedSermons = [...latestBySermon.values()]
    .map((row) => ({
      evaluationId: row.evaluationId,
      sermonId: row.sermonId,
      sermonTitle: row.sermonTitle,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      overallScore: row.overallScore,
      promptVersion: row.promptVersion,
    }))
    .sort((left, right) =>
      compareEvaluationChronology(chronologyRef(left), chronologyRef(right)),
    );

  return {
    includedSermons,
    excludedSermonCount: excludedSermonIds.size,
  };
}

export function rollingMeansAtEachSermon(
  sermons: readonly GrowthTrendSermonPoint[],
): GrowthTrendRollingPoint[] {
  if (sermons.length < GROWTH_ROLLING_WINDOW) {
    return [];
  }

  const points: GrowthTrendRollingPoint[] = [];
  for (let index = GROWTH_ROLLING_WINDOW - 1; index < sermons.length; index++) {
    const window = sermons.slice(index - (GROWTH_ROLLING_WINDOW - 1), index + 1);
    const rollingMean =
      window.reduce((sum, sermon) => sum + sermon.overallScore, 0) /
      GROWTH_ROLLING_WINDOW;
    const sermon = sermons[index];
    points.push({ ...sermon, rollingMean });
  }

  return points.slice(-GROWTH_CHART_POINT_LIMIT);
}

function meanScore(sermons: readonly GrowthTrendSermonPoint[]): number {
  return (
    sermons.reduce((sum, sermon) => sum + sermon.overallScore, 0) /
    sermons.length
  );
}

function spellSermonCount(count: number): string {
  if (count === 12) {
    return "twelve";
  }
  return String(count);
}

export function sampleTransparencyLine(
  includedSermonCount: number,
  excludedSermonCount: number,
): string {
  if (excludedSermonCount > 0) {
    return `Across ${includedSermonCount} sermons. ${excludedSermonCount} excluded by you.`;
  }
  return `Across ${includedSermonCount} sermons.`;
}

export function directionCopyForSeries(
  includedSermons: readonly GrowthTrendSermonPoint[],
  rollingPoints: readonly GrowthTrendRollingPoint[],
): string {
  const count = includedSermons.length;
  if (count < GROWTH_LINE_MIN_SERMONS) {
    return `Your trend line starts at six sermons. You have ${count} so far.`;
  }

  const mid = Math.floor(rollingPoints.length / 2);
  if (mid === 0) {
    return `Your trend line starts at six sermons. You have ${count} so far.`;
  }

  const firstHalf = rollingPoints.slice(0, mid);
  const secondHalf = rollingPoints.slice(rollingPoints.length - mid);
  const firstMean =
    firstHalf.reduce((sum, point) => sum + point.rollingMean, 0) /
    firstHalf.length;
  const secondMean =
    secondHalf.reduce((sum, point) => sum + point.rollingMean, 0) /
    secondHalf.length;
  const delta = toDisplayScore(secondMean) - toDisplayScore(firstMean);

  if (Math.abs(delta) < GROWTH_DIRECTION_FLOOR) {
    return "Holding steady. Movement this small is ordinary variation in the evaluation, not a change in your preaching.";
  }

  const direction = delta > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(delta).toFixed(1)} over your last ${spellSermonCount(rollingPoints.length)} sermons.`;
}

export function buildGrowthTrendSeries(
  rows: readonly GrowthTrendSourceRow[],
): GrowthTrendSeries {
  const { includedSermons, excludedSermonCount } =
    collapseToLatestValidSermon(rows);
  const includedSermonCount = includedSermons.length;
  const rollingPoints = rollingMeansAtEachSermon(includedSermons);
  const showLine = includedSermonCount >= GROWTH_LINE_MIN_SERMONS;
  const showStatPair = includedSermonCount >= GROWTH_STAT_PAIR_MIN_SERMONS;

  return {
    includedSermonCount,
    excludedSermonCount,
    includedSermons,
    rollingPoints: showLine ? rollingPoints : [],
    showLine,
    showStatPair,
    firstFourDisplay: showStatPair
      ? toDisplayScore(meanScore(includedSermons.slice(0, GROWTH_ROLLING_WINDOW)))
      : null,
    latestFourDisplay: showStatPair
      ? toDisplayScore(meanScore(includedSermons.slice(-GROWTH_ROLLING_WINDOW)))
      : null,
    sampleLine: sampleTransparencyLine(
      includedSermonCount,
      excludedSermonCount,
    ),
    directionCopy: directionCopyForSeries(includedSermons, rollingPoints),
  };
}
