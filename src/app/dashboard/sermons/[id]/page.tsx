import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import { SermonManuscript } from "@/components/dashboard/SermonManuscript";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import {
  listEvaluationsForSermon,
  sermonHasActiveEvaluation,
} from "@/lib/evaluation/queries";
import { formatDisplayScoreBare } from "@/lib/evaluation/display-score";
import { formatStoredScoreBand } from "@/lib/evaluation/schema";
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
  const latestComplete = evaluations.find((e) => e.status === "complete");
  const evaluationHref = latestComplete
    ? `/dashboard/sermons/${sermon.id}/evaluations/${latestComplete.id}`
    : null;
  const { bandLabel, tierLabel } = latestComplete
    ? parseEvaluationCardLabels(
        latestComplete.score_band,
        latestComplete.overall_score,
      )
    : { bandLabel: "", tierLabel: null };
  const scoreDisplay =
    latestComplete?.overall_score != null
      ? formatDisplayScoreBare(latestComplete.overall_score)
      : null;

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

      <div className={latestComplete ? "mb-6" : "mb-8"}>
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

      {latestComplete && evaluationHref ? (
        <Link
          href={evaluationHref}
          className="mb-6 block rounded no-underline transition-opacity hover:opacity-95"
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
            <p
              className="text-[48px] leading-none italic sm:text-[52px]"
              style={{ ...serifFont, color: "var(--sc-accent-soft)" }}
            >
              {bandLabel}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {tierLabel ? (
                <p
                  className="text-[15px] font-medium"
                  style={{ ...uiFont, color: "rgba(250,248,243,0.85)" }}
                >
                  {tierLabel}
                </p>
              ) : null}
              {scoreDisplay ? (
                <p
                  className="text-[28px] font-semibold leading-none sm:text-[32px]"
                  style={{ ...uiFont, color: "#faf8f3" }}
                >
                  {scoreDisplay}
                  <span
                    className="ml-1 text-[15px] font-medium"
                    style={{ color: "rgba(250,248,243,0.55)" }}
                  >
                    / 10
                  </span>
                </p>
              ) : null}
            </div>
            <p
              className="mt-6 text-[13px] font-medium"
              style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
            >
              View full report →
            </p>
          </div>
        </Link>
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

      <EvaluateButton
        sermonId={sermon.id}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
      />
    </main>
  );
}
