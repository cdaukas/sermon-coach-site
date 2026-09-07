import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GenerateMovementButton,
  LockBaselineButton,
} from "@/components/movement/MovementActions";
import { MovementReportView } from "@/components/movement/MovementReportView";
import { DeepDiveHistoryList } from "@/components/prep-card/DeepDiveHistoryList";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import {
  getMovementReportById,
  listDeepDiveHistory,
} from "@/lib/prep-card/deep-dive-history";
import { getLatestThemeDiagnostic } from "@/lib/prep-card/queries";
import { waitingCopy } from "@/lib/movement/copy";
import { themeDisplayName } from "@/lib/movement/themes";
import { MOVEMENT_MIN_NEW_SERMONS } from "@/lib/movement/types";
import {
  countComparisonSermons,
  getLatestMovementReport,
  getOpenMovementBaseline,
} from "@/lib/movement/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Movement report — The Sermon Coach",
  robots: { index: false, follow: false },
};

type MovementPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function MovementPage({ searchParams }: MovementPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasPrepCardAccess(user.id))) {
    notFound();
  }

  const params = await searchParams;
  const requestedId = typeof params.id === "string" ? params.id.trim() : "";
  const history = await listDeepDiveHistory(user.id);

  if (requestedId) {
    const archived = await getMovementReportById(user.id, requestedId);
    if (!archived) {
      notFound();
    }
    const latest = await getLatestMovementReport(user.id);
    const isHistorical = latest?.id !== archived.id;

    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-8">
        <div className="mb-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            <Link href="/dashboard" style={{ color: "inherit" }}>
              Dashboard
            </Link>
            {" · "}
            Movement
            {isHistorical ? " · archived" : ""}
          </p>
          <h1
            className="text-[32px] font-normal tracking-tight md:text-[36px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Movement report
          </h1>
          <p
            className="mt-2 max-w-[48ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {isHistorical
              ? "Frozen snapshot — counts and copy as they were when this report was built."
              : "The second half of the six-month arc. It answers whether the three disciplines moved — and must be able to say they did not."}
          </p>
        </div>
        <MovementReportView snapshot={archived.snapshot} />
        <DeepDiveHistoryList entries={history} currentId={archived.id} />
      </main>
    );
  }

  let baseline = null;
  let report = null;
  let newCount = 0;
  try {
    baseline = await getOpenMovementBaseline(user.id);
    report = await getLatestMovementReport(user.id);
    if (baseline) {
      newCount = await countComparisonSermons({
        userId: user.id,
        baselineSermonIds: baseline.sermonIds,
        afterIso: baseline.generatedAt,
      });
    }
  } catch (error) {
    console.warn(
      "[movement] tables unavailable",
      error instanceof Error ? error.message : error,
    );
  }

  const diagnostic = await getLatestThemeDiagnostic();
  const reportForBaseline =
    report && baseline && report.baselineId === baseline.id ? report : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-8">
      <div className="mb-8">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          <Link href="/dashboard" style={{ color: "inherit" }}>
            Dashboard
          </Link>
          {" · "}
          Movement
        </p>
        <h1
          className="text-[32px] font-normal tracking-tight md:text-[36px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Movement report
        </h1>
        <p
          className="mt-2 max-w-[48ch] text-[15px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          The second half of the six-month arc. It answers whether the three
          disciplines moved — and must be able to say they did not.
        </p>
      </div>

      {!baseline ? (
        <div
          className="rounded border px-6 py-10"
          style={{
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <p
            className="mb-6 max-w-[52ch] text-[17px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {diagnostic
              ? "Lock a work quarter from your latest theme diagnostic. That freezes the three focus disciplines and the exact sermon set the diagnostic ran on."
              : "Build a theme diagnostic first. The movement baseline locks its focus three and sermon ids."}
          </p>
          {diagnostic ? <LockBaselineButton /> : null}
        </div>
      ) : reportForBaseline ? (
        <MovementReportView snapshot={reportForBaseline.snapshot} />
      ) : (
        <div
          className="rounded border px-6 py-10"
          style={{
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <p
            className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            {themeDisplayName(baseline.themeId)} · work quarter open
          </p>
          <p
            className="mb-4 max-w-[52ch] text-[17px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {waitingCopy(newCount, MOVEMENT_MIN_NEW_SERMONS)}
          </p>
          <p
            className="mb-6 max-w-[52ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            Baseline locked on{" "}
            {new Date(baseline.generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . Comparing only sermons preached since — never pooled with the
            original {baseline.sermonIds.length}.
          </p>
          {newCount >= MOVEMENT_MIN_NEW_SERMONS ? (
            <GenerateMovementButton />
          ) : null}
        </div>
      )}

      <DeepDiveHistoryList
        entries={history}
        currentId={reportForBaseline?.id ?? null}
      />
    </main>
  );
}
