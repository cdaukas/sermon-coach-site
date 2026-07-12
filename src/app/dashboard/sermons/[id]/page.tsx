import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SermonDetailEvalErrorBanner } from "@/components/dashboard/SermonDetailEvalErrorBanner";
import { SermonDetailEvalSection } from "@/components/dashboard/SermonDetailEvalSection";
import { SermonDetailManuscript } from "@/components/dashboard/SermonDetailManuscript";
import { createClient } from "@/lib/supabase/server";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import {
  listEvaluationsForSermon,
  sermonHasActiveEvaluation,
} from "@/lib/evaluation/queries";
import { getSermonWithLatestVersion } from "@/lib/sermons/queries";

/** Long-running Claude evaluation (see STEP_6_PLAN §B). */
export const maxDuration = 300;

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type SermonDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ evalError?: string }>;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
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

export default async function SermonDetailPage({
  params,
  searchParams,
}: SermonDetailPageProps) {
  const { id } = await params;
  const { evalError = null } = await searchParams;
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

      <div className="mb-8">
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

      <SermonDetailEvalErrorBanner evalError={evalError} />

      <SermonDetailEvalSection
        sermonId={sermon.id}
        completeEvaluations={completeEvaluations}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
      />

      <SermonDetailManuscript content={version.content} />
    </main>
  );
}
