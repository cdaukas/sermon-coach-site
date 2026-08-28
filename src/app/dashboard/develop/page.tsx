import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveMenteesList } from "@/components/mentor/ActiveMenteesList";
import { AddSomeonePlans } from "@/components/mentor/AddSomeonePlans";
import { MentorInvitePanel } from "@/components/mentor/MentorInvitePanel";
import { MentoredSubmissionsList } from "@/components/mentor/MentoredSubmissionsList";
import { MentorSeatCapacityPanel } from "@/components/mentor/MentorSeatCapacityPanel";
import { PendingInvitesList } from "@/components/mentor/PendingInvitesList";
import { getMentorSeatCapacity } from "@/lib/mentor/capacity";
import { listMentorSeatsForMentor } from "@/lib/mentor/list-seats";
import { listMentoredEvaluationsForMentor } from "@/lib/mentor/submissions";
import { isMentoringUiAllowed } from "@/lib/mentor/uiAccess";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mentoring",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function DevelopPage() {
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

  const [submissions, seats, capacity] = await Promise.all([
    listMentoredEvaluationsForMentor(),
    listMentorSeatsForMentor(),
    getMentorSeatCapacity(),
  ]);

  const hasPreachers = seats.active.length > 0;
  const hasPendingInvites = seats.pending.length > 0;
  const hasSubmissions = submissions.length > 0;

  return (
    <>
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

        {capacity ? <MentorSeatCapacityPanel capacity={capacity} /> : null}

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

        {/* Your Team — render only when the pastor holds a Teams subscription. */}
        {/*
          Teams is dark. A team card shows names, submission counts, and dates.
          Never sermon titles, never scores, never an Open evaluation link.
          Only when Team Coaching is active does it look like a mentor card.
          Copying the Your Preachers card here would break the privacy model.
        */}

        {/* Your Preaching Lab — render only when the pastor holds an active lab term. */}

        {/* Your Class — render only when the pastor holds a hand-provisioned Classroom. */}

        {hasPreachers ? <ActiveMenteesList mentees={seats.active} /> : null}

        {hasSubmissions ? (
          <MentoredSubmissionsList submissions={submissions} />
        ) : null}

        {hasPendingInvites ? (
          <PendingInvitesList invites={seats.pending} />
        ) : null}
      </main>

      <section
        className="mt-10"
        aria-labelledby="add-someone-heading"
      >
        <h2
          id="add-someone-heading"
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Add someone
        </h2>
        <div className="mt-6">
          <AddSomeonePlans />
        </div>
      </section>
    </>
  );
}
