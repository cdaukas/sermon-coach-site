import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeepDiveLock } from "@/components/deep-dive/DeepDiveLock";
import { DeepDivePicker } from "@/components/deep-dive/DeepDivePicker";
import { DeepDiveThemes } from "@/components/deep-dive/DeepDiveThemes";
import { DeepDiveUnlockBar } from "@/components/deep-dive/DeepDiveUnlockBar";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { profileHasDeepDiveAccess } from "@/lib/prep-card/access";
import {
  deepDiveLockLines,
  deepDiveThemeLabel,
  deepDiveUnlock,
  isDeepDiveQuarterLocked,
  type DeepDiveThemeId,
} from "@/lib/prep-card/deep-dive-dashboard";
import {
  listEligibleDeepDiveSermons,
  loadDeepDiveRuns,
} from "@/lib/prep-card/deep-dive-data";
import { createClient } from "@/lib/supabase/server";
import "../prep-card/prep-card.css";

export const metadata: Metadata = {
  title: "Deep dive — The Sermon Coach",
  robots: { index: false, follow: false },
};

type DeepDivePageProps = {
  searchParams: Promise<{ theme?: string }>;
};

function parseTheme(value: string | undefined): DeepDiveThemeId | null {
  if (value === "ask" || value === "christ") {
    return value;
  }
  return null;
}

export default async function DeepDivePage({ searchParams }: DeepDivePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasDeepDiveAccess(user.id))) {
    notFound();
  }

  const params = await searchParams;
  const theme = parseTheme(params.theme);
  const [sermons, runs] = await Promise.all([
    listEligibleDeepDiveSermons(user.id),
    loadDeepDiveRuns(user.id),
  ]);

  const now = new Date();
  const unlock = deepDiveUnlock(sermons.length);
  const locked =
    runs.latest != null &&
    isDeepDiveQuarterLocked(new Date(runs.latest.generatedAt), now);
  const lock = locked && runs.latest
    ? deepDiveLockLines({
        themeId: runs.latest.themeId,
        generatedAt: new Date(runs.latest.generatedAt),
        now,
      })
    : null;
  const showPicker = theme != null && unlock == null && lock == null;
  const showThemes = unlock == null && lock == null && !showPicker;

  return (
    <main className="deep-dive-page prep-card-page mx-auto w-full max-w-5xl flex-1 py-10">
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        <Link href="/dashboard" style={{ color: "inherit" }}>
          Dashboard
        </Link>
        {" · "}
        Deep dive
      </p>
      <h1
        className={`${showThemes ? "mb-2" : "mb-8"} text-[32px] font-normal tracking-tight md:text-[36px]`}
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Deep dive
      </h1>

      {unlock ? <DeepDiveUnlockBar unlock={unlock} /> : null}

      {lock ? (
        <DeepDiveLock ranLine={lock.ranLine} prepCardLine={lock.prepCardLine} />
      ) : null}

      {showThemes ? (
        <>
          <p
            className="mb-8 text-[16px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            One deep dive per quarter.
          </p>
          <DeepDiveThemes lastRunAt={runs.lastRunAt} now={now} />
        </>
      ) : null}

      {showPicker && theme ? (
        <DeepDivePicker
          themeId={theme}
          themeLabel={deepDiveThemeLabel(theme)}
          sermons={sermons}
        />
      ) : null}
    </main>
  );
}
