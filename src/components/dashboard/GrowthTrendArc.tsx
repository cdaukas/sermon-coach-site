"use client";

import { useState } from "react";

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

/** Full tooltip date — same pattern as GrowthReportView (`dateStyle: "medium"`). */
function formatTooltipDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

function formatEndpointDate(iso: string, includeYear: boolean): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(iso));
}

function spanCrossesCalendarYear(firstCompletedAt: string, lastCompletedAt: string): boolean {
  return (
    new Date(firstCompletedAt).getFullYear() !== new Date(lastCompletedAt).getFullYear()
  );
}

type PlottedPoint = TrendArcEvaluationItem & {
  x: number;
  y: number;
  displayScore: string;
};

function ArcDotTooltip({
  point,
  svgWidth,
  svgHeight,
}: {
  point: PlottedPoint;
  svgWidth: number;
  svgHeight: number;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-[200px] rounded border px-2.5 py-2 text-center shadow-sm"
      style={{
        left: `${(point.x / svgWidth) * 100}%`,
        top: `${(point.y / svgHeight) * 100}%`,
        transform: "translate(-50%, calc(-100% - 12px))",
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
      }}
      role="tooltip"
    >
      <p className="text-[11px] leading-snug" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
        {formatTooltipDate(point.completedAt)}
      </p>
      <p className="text-[12px] font-semibold leading-snug" style={{ ...uiFont, color: "var(--sc-ink)" }}>
        {point.displayScore} / 10
      </p>
      <p className="text-[11px] leading-snug" style={{ ...uiFont, color: "var(--sc-ink-mid)" }}>
        {point.sermonTitle}
      </p>
    </div>
  );
}

export function GrowthTrendArc({ points }: GrowthTrendArcProps) {
  const [activePointId, setActivePointId] = useState<string | null>(null);

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
  const dateLabelY = plotTop + plotHeight + 18;

  const yFloor = scoreToY(SCORE_MIN, plotTop, plotHeight);
  const yFaithfulTop = scoreToY(39, plotTop, plotHeight);
  const yStrongTop = scoreToY(47, plotTop, plotHeight);
  const yCeiling = scoreToY(SCORE_MAX, plotTop, plotHeight);

  const plotted: PlottedPoint[] = sorted.map((point, index) => {
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

  const firstPoint = plotted[0];
  const lastPoint = plotted[plotted.length - 1];
  const includeYearOnEndpoints = spanCrossesCalendarYear(
    firstPoint.completedAt,
    lastPoint.completedAt,
  );
  const activePoint = plotted.find((point) => point.evaluationId === activePointId) ?? null;

  const linePoints = plotted.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <figure className="relative mb-8 w-full">
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
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActivePointId(point.evaluationId)}
              onMouseLeave={() =>
                setActivePointId((current) =>
                  current === point.evaluationId ? null : current,
                )
              }
              onFocus={() => setActivePointId(point.evaluationId)}
              onBlur={() =>
                setActivePointId((current) =>
                  current === point.evaluationId ? null : current,
                )
              }
              onClick={() =>
                setActivePointId((current) =>
                  current === point.evaluationId ? null : point.evaluationId,
                )
              }
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="var(--sc-accent)"
              stroke="var(--sc-panel)"
              strokeWidth="1.5"
              pointerEvents="none"
            />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              pointerEvents="none"
              style={{ ...uiFont, fontSize: "10px", fill: "var(--sc-ink-mid)" }}
            >
              {point.displayScore}
            </text>
          </g>
        ))}

        <text
          x={firstPoint.x}
          y={dateLabelY}
          textAnchor={plotted.length === 1 ? "middle" : "start"}
          style={{ ...uiFont, fontSize: "10px", fill: "var(--sc-ink-soft)" }}
        >
          {formatEndpointDate(firstPoint.completedAt, includeYearOnEndpoints)}
        </text>
        {plotted.length > 1 ? (
          <text
            x={lastPoint.x}
            y={dateLabelY}
            textAnchor="end"
            style={{ ...uiFont, fontSize: "10px", fill: "var(--sc-ink-soft)" }}
          >
            {formatEndpointDate(lastPoint.completedAt, includeYearOnEndpoints)}
          </text>
        ) : null}
      </svg>

      {activePoint ? (
        <ArcDotTooltip point={activePoint} svgWidth={width} svgHeight={height} />
      ) : null}
    </figure>
  );
}
