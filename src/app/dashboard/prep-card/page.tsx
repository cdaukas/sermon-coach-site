import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratePrepCardButton } from "@/components/prep-card/GeneratePrepCardButton";
import { PrepCardView } from "@/components/prep-card/PrepCardView";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import { getLatestPrepCard } from "@/lib/prep-card/queries";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { createClient } from "@/lib/supabase/server";
import "./prep-card.css";

export const metadata: Metadata = {
  title: "Prep card — The Sermon Coach",
  robots: { index: false, follow: false },
};

export default async function PrepCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await profileHasPrepCardAccess(user.id))) {
    notFound();
  }

  const card = await getLatestPrepCard();

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
            Prep card
          </p>
          <h1
            className="text-[32px] font-normal tracking-tight md:text-[36px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Prep card
          </h1>
          <p
            className="mt-2 max-w-[48ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            One page for Saturday. Strengths and focus from the measures we can
            already count.
          </p>
        </div>
        <GeneratePrepCardButton />
      </div>

      {card ? (
        <PrepCardView snapshot={card.snapshot} />
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
            No prep card yet. Build one from your recent sermons. The card uses
            measured disciplines that already run (visible ask, cost, conclusion
            finish, frame, reciprocal ask, naming, address).
          </p>
        </div>
      )}
    </main>
  );
}
