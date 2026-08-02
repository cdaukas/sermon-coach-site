"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { parseEvaluationCardLabels } from "@/lib/evaluation/display-score";
import type { DashboardSermonRow } from "@/lib/sermons/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function formatSavedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function bandLabel(scoreBand: string | null): string {
  return parseEvaluationCardLabels(scoreBand, null).bandLabel;
}

type SermonListProps = {
  sermons: DashboardSermonRow[];
  header?: ReactNode;
};

function SermonRow({ sermon }: { sermon: DashboardSermonRow }) {
  const href = sermon.latestEvaluation
    ? `/dashboard/sermons/${sermon.id}/evaluations/${sermon.latestEvaluation.id}`
    : `/dashboard/sermons/${sermon.id}`;

  const passage = sermon.primary_passage?.trim() || null;
  const meta = passage
    ? `${passage} · Saved ${formatSavedDate(sermon.created_at)}`
    : `Saved ${formatSavedDate(sermon.created_at)}`;

  const evaluated = sermon.latestEvaluation != null;
  const chipLabel = evaluated
    ? bandLabel(sermon.latestEvaluation!.score_band)
    : "Not run";

  return (
    <li style={{ margin: "0 0 9px", listStyle: "none" }}>
      <Link
        href={href}
        className="no-underline transition-colors"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "#ffffff",
          border: "1px solid #d4cfc1",
          borderRadius: 4,
          boxShadow: "var(--sc-shadow)",
          padding: "15px 18px",
          boxSizing: "border-box",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = "#c9a55c";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = "#d4cfc1";
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <p
            className="truncate"
            style={{
              ...serifFont,
              margin: 0,
              fontSize: 19,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "#1a2332",
            }}
          >
            {sermon.title}
          </p>
          <p
            className="truncate"
            style={{
              ...uiFont,
              margin: "3px 0 0",
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.3,
              color: "#4a5568",
            }}
          >
            {meta}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <span
            style={{
              ...uiFont,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1.2,
              borderRadius: 4,
              padding: "4px 9px",
              background: evaluated ? "#faf6ed" : "transparent",
              color: evaluated ? "#a67c2e" : "#4a5568",
              border: evaluated ? "1px solid #e8dcc2" : "1px solid #d4cfc1",
            }}
          >
            {chipLabel}
          </span>
          {sermon.completeEvaluationCount > 1 ? (
            <span
              style={{
                ...uiFont,
                fontSize: 12,
                lineHeight: 1.2,
                color: "#9aa1ac",
                whiteSpace: "nowrap",
              }}
            >
              {sermon.completeEvaluationCount} runs
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function SermonList({ sermons, header }: SermonListProps) {
  if (sermons.length === 0) {
    return header ? <>{header}</> : null;
  }

  return (
    <>
      {header}
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {sermons.map((sermon) => (
          <SermonRow key={sermon.id} sermon={sermon} />
        ))}
      </ul>
    </>
  );
}
