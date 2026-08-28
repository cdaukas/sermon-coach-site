import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MentorInviteFlow } from "@/components/mentor/MentorInviteFlow";
import { MentoringPlans } from "@/components/mentor/MentoringPlans";
import { PendingInvitesList } from "@/components/mentor/PendingInvitesList";
import { PreacherList } from "@/components/mentor/PreacherList";
import { YourSeats } from "@/components/mentor/YourSeats";
import { buildPreacherCards } from "@/components/mentor/mentoring-model";
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

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-[28px] font-semibold leading-tight tracking-tight"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </h2>
  );
}

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

  const preachers = buildPreacherCards(seats.active, submissions);
  const hasPreachers = preachers.length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-1 pb-20">
      <header className="pt-2 pb-12 sm:pb-16">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Mentoring
        </p>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.15] tracking-tight sm:text-[42px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Develop a preacher, one sermon at a time.
        </h1>
        <p
          className="mt-5 max-w-xl text-[16px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Invite someone you&rsquo;re mentoring. They submit sermons to Sermon
          Coach, you review the evaluation, and you decide when to release
          their score.
        </p>
        <div className="mt-8">
          {capacity ? (
            <MentorInviteFlow
              capacity={capacity}
              initialDisplayName={initialDisplayName}
            />
          ) : null}
        </div>
      </header>

      {/* Your Team — render only when the pastor holds a Teams subscription. */}
      {/*
        Teams is dark. A team card shows names, submission counts, and dates.
        Never sermon titles, never scores, never an Open evaluation link.
        Only when Team Coaching is active does it look like a mentor card.
        Copying the Your Preachers card here would break the privacy model.
      */}

      {/* Your Preaching Lab — render only when the pastor holds an active lab term. */}

      {/* Your Class — render only when the pastor holds a hand-provisioned Classroom. */}

      {hasPreachers ? (
        <section
          aria-labelledby="preachers-heading"
          className="border-t pt-12 sm:pt-14"
          style={{ borderColor: "var(--sc-rule)" }}
        >
          <SectionHeading id="preachers-heading">Your Preachers</SectionHeading>
          <div className="mt-7 space-y-5">
            <PreacherList
              cards={preachers}
              inviteAction={
                capacity ? (
                  <MentorInviteFlow
                    capacity={capacity}
                    initialDisplayName={initialDisplayName}
                  />
                ) : null
              }
            />
          </div>
        </section>
      ) : null}

      <PendingInvitesList invites={seats.pending} />

      <section
        aria-labelledby="add-someone-heading"
        className="mt-16 border-t pt-12 sm:mt-20 sm:pt-14"
        style={{ borderColor: "var(--sc-rule)" }}
      >
        <SectionHeading id="add-someone-heading">Add someone</SectionHeading>
        <div className="mt-7">
          <MentoringPlans />
        </div>
      </section>

      {capacity ? (
        <div
          className="mt-16 border-t pt-10 sm:mt-20"
          style={{ borderColor: "var(--sc-rule)" }}
        >
          <YourSeats capacity={capacity} />
        </div>
      ) : null}
    </main>
  );
}
