import type { Metadata } from "next";
import Link from "next/link";
import { GrowthReportPicker } from "@/components/dashboard/GrowthReportPicker";
import { GrowthReportView } from "@/components/dashboard/GrowthReportView";
import { loadGrowthReportData } from "@/lib/evaluation/growth-report";
import { listRecentCompleteEvaluations } from "@/lib/evaluation/queries";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export const metadata: Metadata = {
  title: "Growth report — The Sermon Coach",
};

type GrowthReportPageProps = {
  searchParams: Promise<{ baseline?: string; current?: string }>;
};

function GrowthReportUnavailable() {
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

      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Growth report
      </p>
      <h1
        className="mb-4 text-[32px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        How your preaching is moving
      </h1>
      <p className="text-[15px] leading-relaxed" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
        Complete at least two sermon evaluations to compare growth across sermons.
      </p>
    </main>
  );
}

function resolveSelectedEvaluationId(
  options: { evaluationId: string }[],
  requestedId: string | undefined,
  fallbackIndex: number,
): string {
  const trimmed = requestedId?.trim();
  if (trimmed && options.some((option) => option.evaluationId === trimmed)) {
    return trimmed;
  }

  return options[fallbackIndex]?.evaluationId ?? options[0].evaluationId;
}

export default async function GrowthReportPage({
  searchParams,
}: GrowthReportPageProps) {
  const options = await listRecentCompleteEvaluations();

  if (options.length < 2) {
    return <GrowthReportUnavailable />;
  }

  const { baseline, current } = await searchParams;
  const defaultBaselineId = options[1].evaluationId;
  const defaultCurrentId = options[0].evaluationId;
  const selectedBaselineId = resolveSelectedEvaluationId(
    options,
    baseline,
    1,
  );
  const selectedCurrentId = resolveSelectedEvaluationId(
    options,
    current,
    0,
  );

  const baselineOption = options.find(
    (option) => option.evaluationId === selectedBaselineId,
  );
  const currentOption = options.find(
    (option) => option.evaluationId === selectedCurrentId,
  );

  const hasGenerateParams = Boolean(baseline?.trim() && current?.trim());
  const sameSermonSelected =
    baselineOption != null &&
    currentOption != null &&
    baselineOption.sermonId === currentOption.sermonId;

  let reportData = null;
  if (hasGenerateParams && baselineOption && currentOption && !sameSermonSelected) {
    reportData = await loadGrowthReportData(
      selectedBaselineId,
      selectedCurrentId,
    );
  }

  return (
    <>
      <main
        className="mb-6 rounded px-8 py-10"
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

        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Growth report
        </p>
        <h1
          className="mb-8 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          How your preaching is moving
        </h1>

        <GrowthReportPicker
          options={options}
          selectedBaselineId={selectedBaselineId}
          selectedCurrentId={selectedCurrentId}
        />

        {hasGenerateParams && sameSermonSelected ? (
          <p
            className="mt-6 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            role="status"
          >
            Choose two different sermons to generate a growth report.
          </p>
        ) : null}

        {hasGenerateParams &&
        !sameSermonSelected &&
        baselineOption &&
        currentOption &&
        !reportData ? (
          <p
            className="mt-6 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            role="status"
          >
            Those evaluations could not be loaded. Choose two completed evaluations
            from your library.
          </p>
        ) : null}
      </main>

      {reportData ? <GrowthReportView data={reportData} /> : null}
    </>
  );
}
