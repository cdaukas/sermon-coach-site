import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GrowthReportPicker } from "@/components/dashboard/GrowthReportPicker";
import { profileHasGrowthAccess } from "@/lib/growth/access";
import { createClient } from "@/lib/supabase/server";
import { GrowthReportView } from "@/components/dashboard/GrowthReportView";
import { GrowthTrendArc } from "@/components/dashboard/GrowthTrendArc";
import { NewEvaluationButton } from "@/components/dashboard/NewEvaluationButton";
import {
  loadGrowthReportData,
  toGrowthReportPresentation,
} from "@/lib/evaluation/growth-report";
import { orderEvaluationIdsByCompletedAt } from "@/lib/evaluation/growth-report-ordering";
import {
  listRecentCompleteEvaluations,
  loadGrowthTrendSeries,
} from "@/lib/evaluation/queries";
import type { GrowthTrendSeries } from "@/lib/evaluation/growth-trend";
import type { TrendArcEvaluationItem } from "@/lib/evaluation/growth-report-types";

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

      <div
        className="mb-4 flex flex-wrap items-end justify-between gap-4"
        style={{ borderBottom: "1px solid #d4cfc1", paddingBottom: 18 }}
      >
        <div className="min-w-0">
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
        </div>
        <NewEvaluationButton />
      </div>
      <p className="text-[15px] leading-relaxed" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
        Complete at least two sermon evaluations to compare growth across sermons.
      </p>
    </main>
  );
}

function GrowthReportHeadline() {
  return (
    <>
      <Link
        href="/dashboard"
        className="mb-8 inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← Back to library
      </Link>

      <div
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
        style={{ borderBottom: "1px solid #d4cfc1", paddingBottom: 18 }}
      >
        <div className="min-w-0">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            Growth report
          </p>
          <h1
            className="text-[32px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            How your preaching is moving
          </h1>
        </div>
        <NewEvaluationButton />
      </div>
    </>
  );
}


function rollingPointsToArcItems(
  series: GrowthTrendSeries,
): TrendArcEvaluationItem[] {
  return series.rollingPoints.map((point) => ({
    evaluationId: point.evaluationId,
    sermonTitle: point.sermonTitle,
    completedAt: point.completedAt,
    createdAt: point.createdAt,
    compositeWeighted: point.rollingMean,
    promptVersion: point.promptVersion,
  }));
}

function GrowthTrendSection({ series }: { series: GrowthTrendSeries }) {
  return (
    <section className="mb-8" aria-label="Preaching trend">
      {series.showLine ? (
        <>
          <p
            className="mb-4 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Each point is the average of your last four sermons. That keeps one
            unusual Sunday from looking like a trend.
          </p>
          {series.showStatPair &&
          series.firstFourDisplay != null &&
          series.latestFourDisplay != null ? (
            <dl className="mb-4 flex flex-wrap gap-8">
              <div>
                <dt
                  className="text-[12px]"
                  style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                >
                  First four sermons
                </dt>
                <dd
                  className="text-[22px] font-semibold"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  {series.firstFourDisplay.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt
                  className="text-[12px]"
                  style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                >
                  Most recent four
                </dt>
                <dd
                  className="text-[22px] font-semibold"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  {series.latestFourDisplay.toFixed(1)}
                </dd>
              </div>
            </dl>
          ) : null}
          <GrowthTrendArc points={rollingPointsToArcItems(series)} />
          <p
            className="mt-2 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {series.directionCopy}
          </p>
        </>
      ) : (
        <p
          className="text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          role="status"
        >
          {series.directionCopy}
        </p>
      )}
      <p
        className="mt-3 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {series.sampleLine}
      </p>
    </section>
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasGrowthAccess(user.id))) {
    notFound();
  }

  const [options, trendSeries] = await Promise.all([
    listRecentCompleteEvaluations(),
    loadGrowthTrendSeries(),
  ]);

  if (trendSeries.includedSermonCount === 0) {
    return <GrowthReportUnavailable />;
  }

  if (options.length < 2) {
    return (
      <main
        className="rounded px-8 py-10"
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        <GrowthReportHeadline />
        <GrowthTrendSection series={trendSeries} />
      </main>
    );
  }

  const { baseline, current } = await searchParams;

  if (baseline?.trim() && current?.trim()) {
    const ordered = orderEvaluationIdsByCompletedAt(
      options,
      baseline.trim(),
      current.trim(),
    );

    if (
      ordered.baselineEvaluationId !== baseline.trim() ||
      ordered.currentEvaluationId !== current.trim()
    ) {
      redirect(
        `/dashboard/growth?baseline=${ordered.baselineEvaluationId}&current=${ordered.currentEvaluationId}`,
      );
    }
  }

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
        className={`mb-6 rounded px-8 ${reportData ? "py-4" : "py-10"}`}
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        {!reportData ? <GrowthReportHeadline /> : null}

        <GrowthTrendSection series={trendSeries} />

        <GrowthReportPicker
          options={options}
          selectedBaselineId={selectedBaselineId}
          selectedCurrentId={selectedCurrentId}
          reportVisible={Boolean(reportData)}
          baselineTitle={reportData?.baseline.sermonTitle}
          currentTitle={reportData?.current.sermonTitle}
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

      {reportData ? (
        <GrowthReportView data={toGrowthReportPresentation(reportData)} />
      ) : null}
    </>
  );
}
