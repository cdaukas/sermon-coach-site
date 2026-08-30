import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MentorInviteFlow } from "@/components/mentor/MentorInviteFlow";
import { PendingInvitesList } from "@/components/mentor/PendingInvitesList";
import { PreacherList } from "@/components/mentor/PreacherList";
import { YourSeats } from "@/components/mentor/YourSeats";
import { buildPreacherCards } from "@/components/mentor/mentoring-model";
import { getMentorSeatCapacity } from "@/lib/mentor/capacity";
import { listMentorSeatsForMentor } from "@/lib/mentor/list-seats";
import { listMentoredEvaluationsForMentor } from "@/lib/mentor/submissions";
import { canAccessMentoringUi } from "@/lib/mentor/uiAccess";
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

  if (!user) {
    notFound();
  }

  const capacity = await getMentorSeatCapacity();
  if (!canAccessMentoringUi(user.id, capacity)) {
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

  const preachers = buildPreacherCards(seats.active, submissions);
  const hasPreachers = preachers.length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-1 pb-20">
      <header className="pt-2 pb-12 sm:pb-16">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Develop others
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
      </header>

      {capacity ? <YourSeats capacity={capacity} /> : null}

      {capacity || hasPreachers ? (
        <section
          aria-labelledby="preachers-heading"
          className="border-t pt-12 sm:pt-14"
          style={{ borderColor: "var(--sc-rule)" }}
        >
          {capacity ? (
            <MentorInviteFlow
              capacity={capacity}
              initialDisplayName={initialDisplayName}
              heading={
                <SectionHeading id="preachers-heading">
                  Your Preachers
                </SectionHeading>
              }
            >
              <PreacherList cards={preachers} />
            </MentorInviteFlow>
          ) : (
            <>
              <SectionHeading id="preachers-heading">
                Your Preachers
              </SectionHeading>
              <div className="mt-7">
                <PreacherList cards={preachers} />
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Your Team — render only when the pastor holds a Teams subscription. */}
      {/*
        Teams is dark. A team card shows names, submission counts, and dates.
        Never sermon titles, never scores, never an Open evaluation link.
        Only when Team Coaching is active does it look like a mentor card.
        Copying the Your Preachers card here would break the privacy model.
      */}

      {/* Your Preaching Lab — render only when the pastor holds an active lab term. */}

      {/* Your Class — render only when the pastor holds a hand-provisioned Classroom. */}

      <PendingInvitesList invites={seats.pending} />
    </main>
  );
}
