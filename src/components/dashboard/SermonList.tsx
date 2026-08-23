"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { parseEvaluationCardLabels } from "@/lib/evaluation/display-score";
import type { DashboardSermonRow } from "@/lib/sermons/types";

export const EXCLUSION_HELP_TEXT =
  "Excluded evaluations stay in your library. They just stop counting toward your Growth Report. This does not return a credit or change your monthly evaluation count.";

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
  growthAllowed: boolean;
  onToggleExclude: (sermonId: string, excluded: boolean) => void;
  onRequestDelete: (sermon: DashboardSermonRow) => void;
  busySermonId?: string | null;
};

function buildMobileMeta(
  sermon: DashboardSermonRow,
  growthAllowed: boolean,
): string {
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
  if (growthAllowed && sermon.excluded_from_growth) {
    segments.push("Not counted in growth");
  }
  return segments.join(" · ");
}

function SermonRowMenu({
  sermon,
  busy,
  growthAllowed,
  onToggleExclude,
  onRequestDelete,
}: {
  sermon: DashboardSermonRow;
  busy: boolean;
  growthAllowed: boolean;
  onToggleExclude: (sermonId: string, excluded: boolean) => void;
  onRequestDelete: (sermon: DashboardSermonRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="dashboard-sermon-row-menu" ref={wrapRef}>
      <button
        type="button"
        className="dashboard-sermon-row-menu-button"
        aria-label="Sermon actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">···</span>
      </button>
      {open ? (
        <div className="dashboard-sermon-row-menu-panel" role="menu" id={menuId}>
          {growthAllowed ? (
            <button
              type="button"
              role="menuitem"
              className="dashboard-sermon-row-menu-item"
              title={EXCLUSION_HELP_TEXT}
              onClick={() => {
                setOpen(false);
                onToggleExclude(sermon.id, !sermon.excluded_from_growth);
              }}
            >
              {sermon.excluded_from_growth
                ? "Include in growth tracking"
                : "Exclude from growth tracking"}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="dashboard-sermon-row-menu-item"
            onClick={() => {
              setOpen(false);
              onRequestDelete(sermon);
            }}
          >
            Delete sermon
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SermonRow({
  sermon,
  busy,
  growthAllowed,
  onToggleExclude,
  onRequestDelete,
}: {
  sermon: DashboardSermonRow;
  busy: boolean;
  growthAllowed: boolean;
  onToggleExclude: (sermonId: string, excluded: boolean) => void;
  onRequestDelete: (sermon: DashboardSermonRow) => void;
}) {
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
      <div className="dashboard-sermon-row-inner">
        <Link href={href} className="dashboard-sermon-row-link">
          <span className="dashboard-sermon-row-title-cell">
            <span className="dashboard-sermon-row-title">{sermon.title}</span>
            {growthAllowed && sermon.excluded_from_growth ? (
              <span className="dashboard-sermon-row-growth-tag">
                Not counted in growth
              </span>
            ) : null}
          </span>
          <span className="dashboard-sermon-row-passage">{passage ?? ""}</span>
          <span className="dashboard-sermon-row-date">{dateLabel}</span>
          <span className="dashboard-sermon-row-runs">{runsLabel ?? ""}</span>
          <span
            className={`dashboard-sermon-row-band${evaluated ? "" : " is-empty"}`}
          >
            {bandText}
          </span>
          <span className="dashboard-sermon-row-mobile-meta">
            {buildMobileMeta(sermon, growthAllowed)}
          </span>
        </Link>
        <SermonRowMenu
          sermon={sermon}
          busy={busy}
          growthAllowed={growthAllowed}
          onToggleExclude={onToggleExclude}
          onRequestDelete={onRequestDelete}
        />
      </div>
    </li>
  );
}

export function SermonList({
  sermons,
  header,
  growthAllowed,
  onToggleExclude,
  onRequestDelete,
  busySermonId = null,
}: SermonListProps) {
  if (sermons.length === 0) {
    return header ? <>{header}</> : null;
  }

  return (
    <>
      {header}
      <ul className="dashboard-sermon-list">
        {sermons.map((sermon) => (
          <SermonRow
            key={sermon.id}
            sermon={sermon}
            busy={busySermonId === sermon.id}
            growthAllowed={growthAllowed}
            onToggleExclude={onToggleExclude}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </ul>
    </>
  );
}
