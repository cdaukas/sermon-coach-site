"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { StashedReportMode } from "@/lib/evaluation/context";
import { formatDisplayScoreBare, parseEvaluationCardLabels } from "@/lib/evaluation/display-score";
import {
  groupCompleteEvaluationsByMode,
  modeDisplayName,
  type EvaluationsByMode,
} from "@/lib/evaluation/group-sermon-evaluations";
import type { SermonEvaluationListItem } from "@/lib/evaluation/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const CARD_TABS = [
  { value: "diagnostic", label: "Personal" },
  { value: "coaching", label: "Mentoring" },
] as const satisfies ReadonlyArray<{
  value: StashedReportMode;
  label: string;
}>;

type SermonEvaluationCardsProps = {
  sermonId: string;
  completeEvaluations: SermonEvaluationListItem[];
  selectedMode: StashedReportMode;
  onModeChange: (mode: StashedReportMode) => void;
};

function formatEvaluationDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function evaluationDate(evaluation: SermonEvaluationListItem): string {
  return formatEvaluationDate(evaluation.completed_at ?? evaluation.created_at);
}

function EvaluationScoreSummary({
  evaluation,
  large = false,
}: {
  evaluation: SermonEvaluationListItem;
  large?: boolean;
}) {
  const { bandLabel, tierLabel } = parseEvaluationCardLabels(
    evaluation.score_band,
    evaluation.overall_score,
  );
  const scoreDisplay =
    evaluation.overall_score != null
      ? formatDisplayScoreBare(evaluation.overall_score)
      : null;

  return (
    <>
      <p
        className={
          large
            ? "text-[48px] leading-none italic sm:text-[52px]"
            : "text-[28px] leading-none italic"
        }
        style={{
          ...serifFont,
          color: large ? "var(--sc-accent-soft)" : "var(--sc-accent)",
        }}
      >
        {bandLabel}
      </p>
      <div
        className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 ${large ? "mt-4" : "mt-2"}`}
      >
        {tierLabel ? (
          <p
            className={large ? "text-[15px] font-medium" : "text-[13px] font-medium"}
            style={{
              ...uiFont,
              color: large ? "rgba(250,248,243,0.85)" : "var(--sc-ink-soft)",
            }}
          >
            {tierLabel}
          </p>
        ) : null}
        {scoreDisplay ? (
          <p
            className={
              large
                ? "text-[28px] font-semibold leading-none sm:text-[32px]"
                : "text-[20px] font-semibold leading-none"
            }
            style={{ ...uiFont, color: large ? "#faf8f3" : "var(--sc-ink)" }}
          >
            {scoreDisplay}
            <span
              className={`ml-1 font-medium ${large ? "text-[15px]" : "text-[12px]"}`}
              style={{
                color: large ? "rgba(250,248,243,0.55)" : "var(--sc-ink-soft)",
              }}
            >
              / 10
            </span>
          </p>
        ) : null}
      </div>
    </>
  );
}

function EvaluationDarkCard({
  sermonId,
  evaluation,
}: {
  sermonId: string;
  evaluation: SermonEvaluationListItem;
}) {
  return (
    <Link
      href={`/dashboard/sermons/${sermonId}/evaluations/${evaluation.id}`}
      className="block rounded no-underline transition-opacity hover:opacity-95"
      style={{
        background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div className="px-8 py-8">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
        >
          Latest evaluation
        </p>
        <EvaluationScoreSummary evaluation={evaluation} large />
        <p
          className="mt-2 text-[12px]"
          style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
        >
          {evaluationDate(evaluation)}
        </p>
        <p
          className="mt-6 text-[13px] font-medium"
          style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
        >
          View full report →
        </p>
      </div>
    </Link>
  );
}

function EvaluationLightCard({
  sermonId,
  evaluation,
}: {
  sermonId: string;
  evaluation: SermonEvaluationListItem;
}) {
  return (
    <Link
      href={`/dashboard/sermons/${sermonId}/evaluations/${evaluation.id}`}
      className="block rounded border px-5 py-4 no-underline transition-colors hover:border-[var(--sc-accent)]"
      style={{
        background: "var(--sc-bg)",
        borderColor: "var(--sc-rule)",
      }}
    >
      <EvaluationScoreSummary evaluation={evaluation} />
      <p
        className="mt-2 text-[12px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {evaluationDate(evaluation)}
      </p>
    </Link>
  );
}

function EvaluationEmptyCard({ mode }: { mode: StashedReportMode }) {
  return (
    <div
      className="rounded border px-8 py-8"
      style={{
        background: "var(--sc-bg)",
        borderColor: "var(--sc-rule)",
      }}
    >
      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Not yet run in {modeDisplayName(mode)} mode.
      </p>
    </div>
  );
}

function ModeEvaluationPanel({
  sermonId,
  mode,
  group,
}: {
  sermonId: string;
  mode: StashedReportMode;
  group: EvaluationsByMode[StashedReportMode];
}) {
  return (
    <div className="flex flex-col gap-4">
      {group.latest ? (
        <EvaluationDarkCard sermonId={sermonId} evaluation={group.latest} />
      ) : (
        <EvaluationEmptyCard mode={mode} />
      )}

      {group.older.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Earlier evaluations
          </p>
          {group.older.map((evaluation) => (
            <EvaluationLightCard
              key={evaluation.id}
              sermonId={sermonId}
              evaluation={evaluation}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SermonEvaluationCards({
  sermonId,
  completeEvaluations,
  selectedMode,
  onModeChange,
}: SermonEvaluationCardsProps) {
  const grouped = useMemo(
    () => groupCompleteEvaluationsByMode(completeEvaluations),
    [completeEvaluations],
  );

  return (
    <div className="mb-6">
      <div
        className="mb-4 inline-flex w-full rounded border p-1 sm:w-auto"
        style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
        role="tablist"
        aria-label="Evaluation mode"
      >
        {CARD_TABS.map((tab) => {
          const selected = selectedMode === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onModeChange(tab.value)}
              className="flex-1 rounded px-4 py-2.5 text-[13px] font-medium transition-colors sm:flex-none"
              style={{
                ...uiFont,
                background: selected ? "var(--sc-panel)" : "transparent",
                color: selected ? "var(--sc-ink)" : "var(--sc-ink-soft)",
                boxShadow: selected ? "var(--sc-shadow-lift)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {CARD_TABS.map((tab) => (
        <div
          key={tab.value}
          role="tabpanel"
          hidden={selectedMode !== tab.value}
        >
          <ModeEvaluationPanel
            sermonId={sermonId}
            mode={tab.value}
            group={grouped[tab.value]}
          />
        </div>
      ))}
    </div>
  );
}
