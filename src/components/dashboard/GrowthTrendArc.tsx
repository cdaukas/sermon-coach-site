import { formatDisplayScoreBare } from "@/lib/evaluation/display-score";
import { compareEvaluationChronology } from "@/lib/evaluation/growth-report-ordering";
import type { TrendArcEvaluationItem } from "@/lib/evaluation/growth-report-types";

const uiFont = { fontFamily: "var(--font-ui)" };

const SCORE_MIN = 30;
const SCORE_MAX = 55;
const SCORE_RANGE = SCORE_MAX - SCORE_MIN;

/** Band backdrop fills: accent-pale (Faithful) → accent-soft tint (Strong) → richer soft-gold (Exemplary). */
const BAND_FILL = {
  faithful: "var(--sc-accent-pale)",
  strong: "color-mix(in srgb, var(--sc-accent-soft) 16%, var(--sc-accent-pale))",
  exemplary: "color-mix(in srgb, var(--sc-accent-soft) 32%, var(--sc-accent-pale))",
} as const;

type GrowthTrendArcProps = {
  points: TrendArcEvaluationItem[];
};

function scoreToY(score: number, plotTop: number, plotHeight: number): number {
  return plotTop + ((SCORE_MAX - score) / SCORE_RANGE) * plotHeight;
}

function pointX(index: number, count: number, plotLeft: number, plotWidth: number): number {
  if (count === 1) {
    return plotLeft + plotWidth / 2;
  }

  return plotLeft + ((index + 0.5) / count) * plotWidth;
}

function formatAxisDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function GrowthTrendArc({ points }: GrowthTrendArcProps) {
  const sorted = [...points].sort(compareEvaluationChronology);

  if (sorted.length === 0) {
    return null;
  }

  const margin = { top: 16, right: 20, bottom: 56, left: 92 };
  const width = 720;
  const height = 300;
  const plotLeft = margin.left;
  const plotTop = margin.top;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const yFloor = scoreToY(SCORE_MIN, plotTop, plotHeight);
  const yFaithfulTop = scoreToY(39, plotTop, plotHeight);
  const yStrongTop = scoreToY(47, plotTop, plotHeight);
  const yCeiling = scoreToY(SCORE_MAX, plotTop, plotHeight);

  const plotted = sorted.map((point, index) => {
    const x = pointX(index, sorted.length, plotLeft, plotWidth);
    const y = scoreToY(point.compositeWeighted, plotTop, plotHeight);
    const displayScore = formatDisplayScoreBare(point.compositeWeighted);

    return {
      ...point,
      x,
      y,
      displayScore,
    };
  });

  const linePoints = plotted.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <figure className="mb-8 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Score over time across completed sermon evaluations"
      >
        <rect
          x={plotLeft}
          y={yFaithfulTop}
          width={plotWidth}
          height={yFloor - yFaithfulTop}
          fill={BAND_FILL.faithful}
        />
        <rect
          x={plotLeft}
          y={yStrongTop}
          width={plotWidth}
          height={yFaithfulTop - yStrongTop}
          fill={BAND_FILL.strong}
        />
        <rect
          x={plotLeft}
          y={yCeiling}
          width={plotWidth}
          height={yStrongTop - yCeiling}
          fill={BAND_FILL.exemplary}
        />

        <line
          x1={plotLeft}
          x2={plotLeft + plotWidth}
          y1={yFaithfulTop}
          y2={yFaithfulTop}
          stroke="var(--sc-rule)"
          strokeWidth="1"
        />
        <line
          x1={plotLeft}
          x2={plotLeft + plotWidth}
          y1={yStrongTop}
          y2={yStrongTop}
          stroke="var(--sc-rule)"
          strokeWidth="1"
        />

        <text
          x={plotLeft - 12}
          y={(yFloor + yFaithfulTop) / 2}
          textAnchor="end"
          dominantBaseline="middle"
          style={{ ...uiFont, fontSize: "11px", fill: "var(--sc-ink-soft)" }}
        >
          Faithful
        </text>
        <text
          x={plotLeft - 12}
          y={(yFaithfulTop + yStrongTop) / 2}
          textAnchor="end"
          dominantBaseline="middle"
          style={{ ...uiFont, fontSize: "11px", fill: "var(--sc-ink-soft)" }}
        >
          Strong
        </text>
        <text
          x={plotLeft - 12}
          y={(yStrongTop + yCeiling) / 2}
          textAnchor="end"
          dominantBaseline="middle"
          style={{ ...uiFont, fontSize: "11px", fill: "var(--sc-ink-soft)" }}
        >
          Exemplary
        </text>

        {plotted.length > 1 ? (
          <polyline
            points={linePoints}
            fill="none"
            stroke="var(--sc-ink-soft)"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {plotted.map((point) => (
          <g key={point.evaluationId}>
            <title>
              {point.sermonTitle}: {point.displayScore} / 10
            </title>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="var(--sc-accent)"
              stroke="var(--sc-panel)"
              strokeWidth="1.5"
            />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              style={{ ...uiFont, fontSize: "10px", fill: "var(--sc-ink-mid)" }}
            >
              {point.displayScore}
            </text>
            <text
              x={point.x}
              y={plotTop + plotHeight + 18}
              textAnchor="middle"
              style={{ ...uiFont, fontSize: "10px", fill: "var(--sc-ink-soft)" }}
            >
              {formatAxisDate(point.completedAt)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
