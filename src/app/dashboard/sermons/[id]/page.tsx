import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluateStubButton } from "@/components/evaluation/EvaluateStubButton";
import { SermonManuscript } from "@/components/dashboard/SermonManuscript";
import { listEvaluationsForSermon } from "@/lib/evaluation/queries";
import { getSermonWithLatestVersion } from "@/lib/sermons/queries";

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
  const [sermon, evaluations] = await Promise.all([
    getSermonWithLatestVersion(id),
    listEvaluationsForSermon(id),
  ]);

  if (!sermon?.latest_version) {
    notFound();
  }

  const { latest_version: version } = sermon;
  const latestComplete = evaluations.find((e) => e.status === "complete");

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

      <SermonManuscript content={version.content} />

      <EvaluateStubButton sermonId={sermon.id} />

      {latestComplete ? (
        <p className="mt-4 text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          Latest evaluation:{" "}
          <Link
            href={`/dashboard/sermons/${sermon.id}/evaluations/${latestComplete.id}`}
            className="font-medium no-underline hover:underline"
            style={{ color: "var(--sc-accent)" }}
          >
            {latestComplete.score_band ?? "View"} ({latestComplete.overall_score ?? "—"}/100)
          </Link>
        </p>
      ) : null}
    </main>
  );
}
