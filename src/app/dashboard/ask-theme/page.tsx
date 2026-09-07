import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateAskThemeButton } from "@/components/ask-theme/GenerateAskThemeButton";
import { DeepDiveHistoryList } from "@/components/prep-card/DeepDiveHistoryList";
import { PrepCardView } from "@/components/prep-card/PrepCardView";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import {
  getThemeDiagnosticById,
  listDeepDiveHistory,
} from "@/lib/prep-card/deep-dive-history";
import { getLatestAskThemeReport } from "@/lib/prep-card/queries";
import { createClient } from "@/lib/supabase/server";
import "../prep-card/prep-card.css";

export const metadata: Metadata = {
  title: "The ask — The Sermon Coach",
  robots: { index: false, follow: false },
};

type AskThemePageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AskThemePage({ searchParams }: AskThemePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasPrepCardAccess(user.id))) {
    notFound();
  }

  const params = await searchParams;
  const requestedId = typeof params.id === "string" ? params.id.trim() : "";
  const latest = await getLatestAskThemeReport();

  let report = latest;
  let isHistorical = false;

  if (requestedId) {
    const byId = await getThemeDiagnosticById(user.id, requestedId);
    if (
      !byId ||
      (byId.snapshot.themeId !== "ask" && byId.snapshot.themeId != null)
    ) {
      notFound();
    }
    report = byId;
    isHistorical = latest?.id !== byId.id;
  }

  const history = await listDeepDiveHistory(user.id);

  return (
    <main className="prep-card-page mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-8">
      <div className="screen-only mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            <Link href="/dashboard" style={{ color: "inherit" }}>
              Dashboard
            </Link>
            {" · "}
            The ask
            {isHistorical ? " · archived" : ""}
          </p>
          <h1
            className="text-[32px] font-normal tracking-tight md:text-[36px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            The ask
          </h1>
          <p
            className="mt-2 max-w-[48ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {isHistorical
              ? "Frozen snapshot — counts and copy as they were when this report was built."
              : "Does your ask land on anyone? Strengths and focus from the measures we can already count."}
          </p>
        </div>
        {!isHistorical ? <GenerateAskThemeButton /> : null}
      </div>

      {report ? (
        <>
          <PrepCardView snapshot={report.snapshot} />
          <DeepDiveHistoryList entries={history} currentId={report.id} />
        </>
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
            className="text-[17px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            No ask-theme report yet. Build one from your recent sermons. It runs
            visible ask, cost, conclusion finish, frame, reciprocal ask, naming,
            and address.
          </p>
        </div>
      )}
    </main>
  );
}
