"use client";

import { useId, useState } from "react";
import type { DisplayBandZone, GrowthTrendPoint } from "@/lib/evaluation/growth-trend";
import type { ScoreBand } from "@/lib/evaluation/schema";

const uiFont = { fontFamily: "var(--font-ui)" };

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 20, bottom: 28, left: 36 };
const Y_MIN = 0;
const Y_MAX = 10;

const BAND_ZONE_FILL: Record<ScoreBand, string> = {
  Exemplary: "rgba(166, 124, 46, 0.1)",
  Strong: "rgba(74, 124, 89, 0.08)",
  Faithful: "rgba(74, 124, 89, 0.05)",
  "Needs Improvement": "rgba(201, 137, 46, 0.07)",
  "Significant Concerns": "rgba(160, 72, 72, 0.07)",
};

type GrowthTrendChartProps = {
  points: GrowthTrendPoint[];
  zones: DisplayBandZone[];
};

function plotWidth(): number {
  return CHART_WIDTH - PADDING.left - PADDING.right;
}

function plotHeight(): number {
  return CHART_HEIGHT - PADDING.top - PADDING.bottom;
}

function xAt(index: number, count: number): number {
  if (count <= 1) {
    return PADDING.left + plotWidth() / 2;
  }

  return PADDING.left + (plotWidth() * index) / (count - 1);
}

function yAt(displayScore: number): number {
  const ratio = (displayScore - Y_MIN) / (Y_MAX - Y_MIN);
  return PADDING.top + plotHeight() * (1 - ratio);
}

export function GrowthTrendChart({ points, zones }: GrowthTrendChartProps) {
  const tooltipId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const linePoints = points
    .map((point, index) => `${xAt(index, points.length)},${yAt(point.displayScore)}`)
    .join(" ");

  const activePoint = activeIndex != null ? points[activeIndex] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={tooltipId}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <title id={tooltipId}>
          Your display scores across {points.length} completed evaluations in
          submission order.
        </title>

        {zones.map((zone) => {
          const yTop = yAt(zone.maxDisplay);
          const yBottom = yAt(zone.minDisplay);

          return (
            <rect
              key={zone.band}
              x={PADDING.left}
              y={yTop}
              width={plotWidth()}
              height={Math.max(yBottom - yTop, 0)}
              fill={BAND_ZONE_FILL[zone.band]}
            />
          );
        })}

        {[0, 2, 4, 6, 8, 10].map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + plotWidth()}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="var(--sc-rule)"
              strokeWidth={1}
              strokeDasharray={tick === 0 || tick === 10 ? undefined : "4 4"}
              opacity={0.7}
            />
            <text
              x={PADDING.left - 8}
              y={yAt(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="var(--sc-ink-soft)"
              style={uiFont}
            >
              {tick}
            </text>
          </g>
        ))}

        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--sc-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => {
          const cx = xAt(index, points.length);
          const cy = yAt(point.displayScore);
          const isActive = activeIndex === index;

          return (
            <g key={point.id}>
              <circle
                cx={cx}
                cy={cy}
                r={14}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0}
                aria-label={`Evaluation ${point.submissionOrder}: ${point.displayScoreLabel} on ${point.completedAtLabel}`}
              />
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 5 : 4}
                fill="var(--sc-panel)"
                stroke="var(--sc-accent)"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>

      {activePoint && activeIndex != null ? (
        <div
          className="pointer-events-none absolute rounded border px-3 py-2 text-[12px] shadow-sm"
          style={{
            ...uiFont,
            left: `${(xAt(activeIndex, points.length) / CHART_WIDTH) * 100}%`,
            top: `${(yAt(activePoint.displayScore) / CHART_HEIGHT) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <p className="font-semibold">{activePoint.displayScoreLabel}</p>
          <p style={{ color: "var(--sc-ink-soft)" }}>
            {activePoint.completedAtLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
