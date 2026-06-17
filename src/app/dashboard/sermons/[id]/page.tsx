import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SermonDetailEvaluationActions } from "@/components/dashboard/SermonDetailEvaluationActions";
import { SermonManuscript } from "@/components/dashboard/SermonManuscript";
import { createClient } from "@/lib/supabase/server";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import {
  listEvaluationsForSermon,
  sermonHasActiveEvaluation,
} from "@/lib/evaluation/queries";
import { formatDisplayScoreBare } from "@/lib/evaluation/display-score";
import { formatStoredScoreBand } from "@/lib/evaluation/schema";
import type { ReportMode, SermonEvaluationListItem } from "@/lib/evaluation/types";
import { getSermonWithLatestVersion } from "@/lib/sermons/queries";

/** Long-running Claude evaluation (see STEP_6_PLAN §B). */
export const maxDuration = 300;

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type SermonDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function reportModeLabel(reportMode: ReportMode): string {
  return reportMode === "coaching" ? "Mentor" : "Personal";
}

function parseEvaluationCardLabels(
  scoreBand: string | null,
  overallScore: number | null,
): { bandLabel: string; tierLabel: string | null } {
  const formatted = formatStoredScoreBand(scoreBand, overallScore);
  const tierMatch = formatted.match(/Tier \d+/);
  const tierLabel = tierMatch?.[0] ?? null;
  const bandLabel = tierMatch
    ? formatted.slice(0, tierMatch.index).replace(/·\s*$/, "").trim()
    : formatted;

  return { bandLabel: bandLabel || "View", tierLabel };
}

function evaluationDate(evaluation: SermonEvaluationListItem): string {
  return formatDate(evaluation.completed_at ?? evaluation.created_at);
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
        className={large ? "text-[48px] leading-none italic sm:text-[52px]" : "text-[28px] leading-none italic"}
        style={{ ...serifFont, color: large ? "var(--sc-accent-soft)" : "var(--sc-accent)" }}
      >
        {bandLabel}
      </p>
      <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 ${large ? "mt-4" : "mt-2"}`}>
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
              style={{ color: large ? "rgba(250,248,243,0.55)" : "var(--sc-ink-soft)" }}
            >
              / 10
            </span>
          </p>
        ) : null}
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
}: SermonDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const sermon = await getSermonWithLatestVersion(id);

  if (!sermon) {
    return { title: "Sermon not found" };
  }

  return { title: sermon.title };
}

export default async function SermonDetailPage({ params }: SermonDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sermon, evaluations, entitlement, hasActiveEvaluation] =
    await Promise.all([
      getSermonWithLatestVersion(id),
      listEvaluationsForSermon(id),
      user ? getEvaluationEntitlement(user.id) : Promise.resolve(null),
      sermonHasActiveEvaluation(id),
    ]);

  if (!sermon?.latest_version) {
    notFound();
  }

  const { latest_version: version } = sermon;
  const completeEvaluations = evaluations.filter(
    (evaluation) => evaluation.status === "complete",
  );
  const [primaryEvaluation, ...olderEvaluations] = completeEvaluations;

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <Link
        href="/dashboard"
        className="mb-8 inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← Back to library
      </Link>

      <div className={primaryEvaluation ? "mb-6" : "mb-8"}>
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Sermon
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {sermon.title}
        </h1>
        <p className="mt-3 text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          Saved {formatDate(version.created_at)}
        </p>
      </div>

      {primaryEvaluation ? (
        <div className="mb-6">
          <Link
            href={`/dashboard/sermons/${sermon.id}/evaluations/${primaryEvaluation.id}`}
            className="block rounded no-underline transition-opacity hover:opacity-95"
            style={{
              background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
              border: "1px solid var(--sc-rule)",
              boxShadow: "var(--sc-shadow-lift)",
            }}
          >
            <div className="px-8 py-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
                >
                  Latest evaluation
                </p>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...uiFont, color: "rgba(250,248,243,0.75)" }}
                >
                  {reportModeLabel(primaryEvaluation.report_mode)}
                </p>
              </div>
              <EvaluationScoreSummary evaluation={primaryEvaluation} large />
              <p
                className="mt-2 text-[12px]"
                style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
              >
                {evaluationDate(primaryEvaluation)}
              </p>
              <p
                className="mt-6 text-[13px] font-medium"
                style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
              >
                View full report →
              </p>
            </div>
          </Link>

          {olderEvaluations.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                Earlier evaluations
              </p>
              {olderEvaluations.map((evaluation) => (
                <Link
                  key={evaluation.id}
                  href={`/dashboard/sermons/${sermon.id}/evaluations/${evaluation.id}`}
                  className="block rounded border px-5 py-4 no-underline transition-colors hover:border-[var(--sc-accent)]"
                  style={{
                    background: "var(--sc-bg)",
                    borderColor: "var(--sc-rule)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p
                        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ ...uiFont, color: "var(--sc-accent)" }}
                      >
                        {reportModeLabel(evaluation.report_mode)}
                      </p>
                      <EvaluationScoreSummary evaluation={evaluation} />
                    </div>
                    <p
                      className="text-[12px]"
                      style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                    >
                      {evaluationDate(evaluation)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <details className="group mb-2">
        <summary
          className="cursor-pointer list-none rounded border px-5 py-3 text-[13px] font-medium transition-colors hover:border-[var(--sc-ink)] [&::-webkit-details-marker]:hidden"
          style={{
            ...uiFont,
            background: "var(--sc-bg)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          View manuscript
        </summary>
        <div className="mt-4">
          <SermonManuscript content={version.content} />
        </div>
      </details>

      <SermonDetailEvaluationActions
        sermonId={sermon.id}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
      />
    </main>
  );
}
