import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MentorInviteFlow } from "@/components/mentor/MentorInviteFlow";
import { MentorSeatPurchaseOptions } from "@/components/mentor/MentorSeatPurchaseOptions";
import { PendingInvitesList } from "@/components/mentor/PendingInvitesList";
import { PreacherList } from "@/components/mentor/PreacherList";
import { YourSeats } from "@/components/mentor/YourSeats";
import { buildPreacherCards } from "@/components/mentor/mentoring-model";
import { SeatPurchasePending } from "@/components/mentor/SeatPurchasePending";
import { getMentorSeatCapacity } from "@/lib/mentor/capacity";
import { mentoringDevelopSurface } from "@/lib/mentor/develop-surface";
import { listMentorSeatsForMentor } from "@/lib/mentor/list-seats";
import { listMentoredEvaluationsForMentor } from "@/lib/mentor/submissions";
import { profileIsTeamAccount } from "@/lib/mentor/team-account";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const teamAccount = user ? await profileIsTeamAccount(user.id) : false;
  return { title: teamAccount ? "Team" : "Mentoring" };
}

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

function PageHeader({ isTeamAccount }: { isTeamAccount: boolean }) {
  return (
    <header className="pt-2 pb-12 sm:pb-16">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        {isTeamAccount ? "Your team" : "Develop others"}
      </p>
      <h1
        className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.15] tracking-tight sm:text-[42px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {isTeamAccount
          ? "Read what your team is preaching."
          : "Develop a preacher, one sermon at a time."}
      </h1>
      <p
        className="mt-5 max-w-xl text-[16px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {isTeamAccount ? (
          <>
            Everyone on staff who preaches gets their own account and their
            own library. You see every evaluation.
          </>
        ) : (
          <>
            Invite someone you&rsquo;re mentoring. They submit sermons to
            Sermon Coach, you review the evaluation, and you decide when to
            release their score.
          </>
        )}
      </p>
    </header>
  );
}

function CapacityError() {
  return (
    <div
      role="alert"
      className="rounded px-7 py-6"
      style={{
        background: "#ffffff",
        boxShadow: "var(--sc-shadow)",
        borderRadius: 4,
        borderLeft: "3px solid #a04848",
      }}
    >
      <h2
        className="text-[25px] font-semibold leading-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your seats could not be reached
      </h2>
      <p
        className="mt-3 max-w-md text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        Nothing has been lost. Try again, and if it keeps happening, email{" "}
        <a
          href="mailto:chris@sermoncoach.com"
          className="underline"
          style={{ color: "var(--sc-accent)" }}
        >
          chris@sermoncoach.com
        </a>{" "}
        and I will look at it personally.
      </p>
      <Link
        href="/dashboard/develop"
        className="mt-6 inline-flex rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide no-underline"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "var(--sc-bg)",
          borderColor: "var(--sc-ink)",
        }}
      >
        Try again
      </Link>
    </div>
  );
}

type DevelopPageProps = {
  searchParams: Promise<{ purchased?: string | string[] }>;
};

export default async function DevelopPage({ searchParams }: DevelopPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const params = await searchParams;
  const purchasedParam = Array.isArray(params.purchased)
    ? params.purchased[0]
    : params.purchased;
  const purchasedReturn = purchasedParam === "1";

  const [capacity, isTeamAccount] = await Promise.all([
    getMentorSeatCapacity(),
    profileIsTeamAccount(user.id),
  ]);
  const surface = mentoringDevelopSurface(capacity);

  if (surface === "error") {
    return (
      <main className="mx-auto w-full max-w-3xl px-1 pb-20">
        <PageHeader isTeamAccount={isTeamAccount} />
        <CapacityError />
      </main>
    );
  }

  if (surface === "purchase") {
    return (
      <main className="mx-auto w-full max-w-3xl px-1 pb-20">
        <PageHeader isTeamAccount={isTeamAccount} />
        {purchasedReturn ? (
          <SeatPurchasePending />
        ) : (
          <MentorSeatPurchaseOptions />
        )}
      </main>
    );
  }

  if (!capacity) {
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
      <PageHeader isTeamAccount={isTeamAccount} />

      {isTeamAccount ? null : <YourSeats capacity={capacity} />}

      {hasPreachers || capacity ? (
        <section
          aria-labelledby="preachers-heading"
          className="border-t pt-12 sm:pt-14"
          style={{ borderColor: "var(--sc-rule)" }}
        >
          <MentorInviteFlow
            capacity={capacity}
            initialDisplayName={initialDisplayName}
            isTeamAccount={isTeamAccount}
            label={isTeamAccount ? "Add a preacher" : "Invite a preacher"}
            heading={
              <SectionHeading id="preachers-heading">
                Your Preachers
              </SectionHeading>
            }
          >
            <PreacherList cards={preachers} isTeamAccount={isTeamAccount} />
          </MentorInviteFlow>
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
