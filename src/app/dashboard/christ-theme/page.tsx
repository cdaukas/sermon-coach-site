import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateChristThemeButton } from "@/components/christ-theme/GenerateChristThemeButton";
import { PrepCardView } from "@/components/prep-card/PrepCardView";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import { getLatestChristThemeReport } from "@/lib/prep-card/queries";
import { createClient } from "@/lib/supabase/server";
import "../prep-card/prep-card.css";

export const metadata: Metadata = {
  title: "Christ in the sermon — The Sermon Coach",
  robots: { index: false, follow: false },
};

export default async function ChristThemePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasPrepCardAccess(user.id))) {
    notFound();
  }

  const report = await getLatestChristThemeReport();

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
            Christ theme
          </p>
          <h1
            className="text-[32px] font-normal tracking-tight md:text-[36px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Christ in the sermon
          </h1>
          <p
            className="mt-2 max-w-[48ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            Does Christ act in this sermon, or is he its destination? Strengths
            and focus from the three measures we can already count.
          </p>
        </div>
        <GenerateChristThemeButton />
      </div>

      {report ? (
        <PrepCardView snapshot={report.snapshot} />
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
            No Christ-theme report yet. Build one from your recent sermons. It
            runs Christ-as-agent in prose and in a main point (UDPipe), plus
            cross named-object, gospel-in-skeleton, and outsider-address.
          </p>
        </div>
      )}
    </main>
  );
}
