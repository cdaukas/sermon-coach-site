import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";
import { getEvaluation } from "@/lib/evaluation/queries";

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

  return { title: `${data.evaluation.result.meta.title} — Evaluation` };
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
        <p style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          This evaluation is not ready yet (status: {evaluation.status}).
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

  return (
    <main
      className="rounded px-6 py-10 md:px-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <Link
        href={`/dashboard/sermons/${sermonId}`}
        className="mb-8 inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← Back to {sermon.title}
      </Link>

      <EvaluationDashboard result={evaluation.result} sermonTitle={sermon.title} />
    </main>
  );
}
