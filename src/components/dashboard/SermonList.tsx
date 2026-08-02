"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { parseEvaluationCardLabels } from "@/lib/evaluation/display-score";
import type { DashboardSermonRow } from "@/lib/sermons/types";

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

function buildMobileMeta(sermon: DashboardSermonRow): string {
  const segments: string[] = [];
  const passage = sermon.primary_passage?.trim() || null;
  if (passage) {
    segments.push(passage);
  }
  segments.push(formatSavedDate(sermon.created_at));
  if (sermon.latestEvaluation) {
    segments.push(bandLabel(sermon.latestEvaluation.score_band));
  } else {
    segments.push("Not run");
  }
  if (sermon.completeEvaluationCount > 1) {
    segments.push(`${sermon.completeEvaluationCount} runs`);
  }
  return segments.join(" · ");
}

function SermonRow({ sermon }: { sermon: DashboardSermonRow }) {
  const href = sermon.latestEvaluation
    ? `/dashboard/sermons/${sermon.id}/evaluations/${sermon.latestEvaluation.id}`
    : `/dashboard/sermons/${sermon.id}`;

  const passage = sermon.primary_passage?.trim() || null;
  const evaluated = sermon.latestEvaluation != null;
  const dateLabel = formatSavedDate(sermon.created_at);
  const runsLabel =
    sermon.completeEvaluationCount > 1
      ? `${sermon.completeEvaluationCount} runs`
      : null;
  const bandText = evaluated
    ? bandLabel(sermon.latestEvaluation!.score_band)
    : "Not run";

  return (
    <li className="dashboard-sermon-row">
      <Link href={href} className="dashboard-sermon-row-link">
        <span className="dashboard-sermon-row-title">{sermon.title}</span>
        <span className="dashboard-sermon-row-passage">{passage ?? ""}</span>
        <span className="dashboard-sermon-row-date">{dateLabel}</span>
        <span className="dashboard-sermon-row-runs">{runsLabel ?? ""}</span>
        <span
          className={`dashboard-sermon-row-band${evaluated ? "" : " is-empty"}`}
        >
          {bandText}
        </span>
        <span className="dashboard-sermon-row-mobile-meta">
          {buildMobileMeta(sermon)}
        </span>
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
      <ul className="dashboard-sermon-list">
        {sermons.map((sermon) => (
          <SermonRow key={sermon.id} sermon={sermon} />
        ))}
      </ul>
    </>
  );
}
