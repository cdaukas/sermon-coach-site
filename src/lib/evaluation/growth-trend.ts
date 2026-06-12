import { formatDisplayScoreBare, toDisplayScore } from "./display-score";
import {
  deriveBandFromWeighted,
  scoreBandSchema,
  type ScoreBand,
} from "./schema";

export type GrowthTrendEvaluationRow = {
  id: string;
  overall_score: number;
  score_band: string | null;
  completed_at: string;
};

export type GrowthTrendPoint = {
  id: string;
  displayScore: number;
  displayScoreLabel: string;
  scoreBand: string | null;
  completedAt: string;
  completedAtLabel: string;
  submissionOrder: number;
};

export type DisplayBandZone = {
  band: ScoreBand;
  minDisplay: number;
  maxDisplay: number;
};

const BANDS_TOP_TO_BOTTOM = scoreBandSchema.options;

function weightedFloorForBand(band: ScoreBand): number {
  for (let weighted = 0; weighted <= 55; weighted += 1) {
    if (deriveBandFromWeighted(weighted) === band) {
      return weighted;
    }
  }

  return 0;
}

/** Band zone edges in display-score space, derived from deriveBandFromWeighted. */
export function getDisplayBandZones(): DisplayBandZone[] {
  const floors = BANDS_TOP_TO_BOTTOM.map(weightedFloorForBand);

  return BANDS_TOP_TO_BOTTOM.map((band, index) => ({
    band,
    minDisplay: toDisplayScore(floors[index]),
    maxDisplay: index === 0 ? 10 : toDisplayScore(floors[index - 1]),
  }));
}

function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toGrowthTrendPoints(
  rows: GrowthTrendEvaluationRow[],
): GrowthTrendPoint[] {
  return rows.map((row, index) => ({
    id: row.id,
    displayScore: toDisplayScore(row.overall_score),
    displayScoreLabel: formatDisplayScoreBare(row.overall_score),
    scoreBand: row.score_band,
    completedAt: row.completed_at,
    completedAtLabel: formatCompletedAt(row.completed_at),
    submissionOrder: index + 1,
  }));
}
