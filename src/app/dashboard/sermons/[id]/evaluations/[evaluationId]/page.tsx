import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";
import { EvaluationPrintButton } from "@/components/evaluation/EvaluationPrintButton";
import { EvaluationPrintHeader } from "@/components/evaluation/EvaluationPrintHeader";
import { getEvaluation } from "@/lib/evaluation/queries";
import "@/app/evaluation-print.css";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationPageProps = {
  params: Promise<{ id: string; evaluationId: string }>;
};

export async function generateMetadata({
  params,
}: EvaluationPageProps): Promise<Metadata> {
  const { id, evaluationId } = await params;
  const data = await getEvaluation(evaluationId, id);

  if (!data?.evaluation.result) {
    return { title: "Evaluation" };
  }

  return { title: `${data.evaluation.result.meta.sermon_title} — Evaluation` };
}

export default async function EvaluationPage({ params }: EvaluationPageProps) {
  const { id: sermonId, evaluationId } = await params;
  const data = await getEvaluation(evaluationId, sermonId);

  if (!data) {
    notFound();
  }

  const { evaluation, sermon } = data;

  if (evaluation.status !== "complete" || !evaluation.result) {
    return (
      <main
        className="rounded px-8 py-10"
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        {evaluation.status === "failed" && evaluation.error_message ? (
          <p
            className="mb-4 text-[15px]"
            style={{ ...uiFont, color: "var(--sc-error)" }}
          >
            {evaluation.error_message}
          </p>
        ) : null}
        <p style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {evaluation.status === "running" || evaluation.status === "pending"
            ? "Evaluation in progress…"
            : `This evaluation is not ready yet (status: ${evaluation.status}).`}
        </p>
        <Link
          href={`/dashboard/sermons/${sermonId}`}
          className="mt-6 inline-block text-[13px] font-medium no-underline hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          ← Back to sermon
        </Link>
      </main>
    );
  }

  const evaluatedAt = evaluation.completed_at ?? evaluation.created_at;
  const pastorName = evaluation.result.meta.preacher_name;
  const scriptureReference =
    evaluation.result.meta.scripture_reference.trim() || null;
  const footerDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(evaluatedAt));

  return (
    <main
      className="evaluation-page-main rounded px-6 py-10 md:px-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div className="screen-only mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/dashboard/sermons/${sermonId}`}
          className="inline-block text-[13px] font-medium no-underline hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          ← Back to {sermon.title}
        </Link>
        <EvaluationPrintButton />
      </div>

      <EvaluationPrintHeader
        pastorName={pastorName}
        sermonTitle={sermon.title}
        scriptureReference={scriptureReference}
        evaluatedAt={evaluatedAt}
      />

      <EvaluationDashboard result={evaluation.result} sermonTitle={sermon.title} />

      <footer
        className="evaluation-print-footer print-only"
        aria-hidden="true"
        data-date={footerDate}
      >
        The Sermon Coach · sermoncoach.online · {footerDate}
      </footer>
    </main>
  );
}
