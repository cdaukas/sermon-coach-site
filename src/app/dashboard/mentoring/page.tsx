import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewEvaluationButton } from "@/components/dashboard/NewEvaluationButton";
import { MentorInvitePanel } from "@/components/mentor/MentorInvitePanel";
import { MentoredSubmissionsList } from "@/components/mentor/MentoredSubmissionsList";
import { listMentoredEvaluationsForMentor } from "@/lib/mentor/submissions";
import { isMentoringUiAllowed } from "@/lib/mentor/uiAccess";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mentoring",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function MentoringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isMentoringUiAllowed(user.id)) {
    notFound();
  }

  let initialDisplayName: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const raw = profile?.display_name;
  initialDisplayName =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

  const submissions = await listMentoredEvaluationsForMentor();

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
        style={{ borderBottom: "1px solid #d4cfc1", paddingBottom: 18 }}
      >
        <div className="min-w-0">
          <h1
            className="text-[32px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Invite someone you are developing
          </h1>
          <p
            className="mt-3 max-w-2xl text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            They preach. You read. The seat is yours, not theirs, and you can end
            it whenever the season is over.
          </p>
        </div>
        <NewEvaluationButton />
      </div>

      <MentorInvitePanel initialDisplayName={initialDisplayName} />

      <MentoredSubmissionsList submissions={submissions} />
    </main>
  );
}
