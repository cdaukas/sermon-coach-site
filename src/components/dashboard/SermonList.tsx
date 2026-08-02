"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
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

const META_SEP = " · ";

function SermonRow({ sermon }: { sermon: DashboardSermonRow }) {
  const href = sermon.latestEvaluation
    ? `/dashboard/sermons/${sermon.id}/evaluations/${sermon.latestEvaluation.id}`
    : `/dashboard/sermons/${sermon.id}`;

  const passage = sermon.primary_passage?.trim() || null;
  const evaluated = sermon.latestEvaluation != null;

  const segments: ReactNode[] = [];

  if (passage) {
    segments.push(
      <span key="passage" className="truncate" style={{ minWidth: 0 }}>
        {passage}
      </span>,
    );
  }

  segments.push(
    <span key="saved" style={{ whiteSpace: "nowrap" }}>
      Saved {formatSavedDate(sermon.created_at)}
    </span>,
  );

  if (evaluated) {
    segments.push(
      <span
        key="band"
        style={{
          ...uiFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          lineHeight: 1,
          borderRadius: 4,
          padding: "4px 9px",
          background: "#faf6ed",
          color: "#a67c2e",
          border: "1px solid #e8dcc2",
          whiteSpace: "nowrap",
        }}
      >
        {bandLabel(sermon.latestEvaluation!.score_band)}
      </span>,
    );
  } else {
    segments.push(
      <span key="band" style={{ whiteSpace: "nowrap" }}>
        Not run
      </span>,
    );
  }

  if (sermon.completeEvaluationCount > 1) {
    segments.push(
      <span
        key="runs"
        style={{
          ...uiFont,
          fontSize: 12,
          lineHeight: 1,
          color: "#9aa1ac",
          whiteSpace: "nowrap",
        }}
      >
        {sermon.completeEvaluationCount} runs
      </span>,
    );
  }

  return (
    <li style={{ margin: "0 0 9px", listStyle: "none" }}>
      <Link
        href={href}
        className="no-underline transition-colors"
        style={{
          display: "block",
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
        <p
          className="truncate"
          style={{
            ...serifFont,
            margin: 0,
            padding: 0,
            fontSize: 19,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "#1a2332",
          }}
        >
          {sermon.title}
        </p>
        <p
          style={{
            ...uiFont,
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            margin: "3px 0 0",
            padding: 0,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1,
            color: "#4a5568",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {segments.map((segment, index) => (
            <Fragment key={index}>
              {index > 0 ? (
                <span aria-hidden="true" style={{ flexShrink: 0 }}>
                  {META_SEP}
                </span>
              ) : null}
              {segment}
            </Fragment>
          ))}
        </p>
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
