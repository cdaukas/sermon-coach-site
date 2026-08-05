import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveMenteesList } from "@/components/mentor/ActiveMenteesList";
import { MentorInvitePanel } from "@/components/mentor/MentorInvitePanel";
import { MentoredSubmissionsList } from "@/components/mentor/MentoredSubmissionsList";
import { PendingInvitesList } from "@/components/mentor/PendingInvitesList";
import { listMentorSeatsForMentor } from "@/lib/mentor/list-seats";
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

  const [submissions, seats] = await Promise.all([
    listMentoredEvaluationsForMentor(),
    listMentorSeatsForMentor(),
  ]);

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <h1
        className="mb-8 text-[32px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Mentoring
      </h1>

      <section aria-labelledby="invite-heading">
        <h2
          id="invite-heading"
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Invite someone you are developing
        </h2>
        <p
          className="mt-3 max-w-2xl text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          They preach. You read. The seat is yours, not theirs, and you can end
          it whenever the season is over.
        </p>

        <div className="mt-6">
          <MentorInvitePanel initialDisplayName={initialDisplayName} />
        </div>
      </section>

      <PendingInvitesList invites={seats.pending} />

      <ActiveMenteesList mentees={seats.active} />

      <MentoredSubmissionsList submissions={submissions} />
    </main>
  );
}
