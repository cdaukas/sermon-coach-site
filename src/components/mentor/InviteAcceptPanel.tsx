"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthSubmit } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";
import {
  mentorAcceptCarryPath,
  messageForAcceptError,
  parseAcceptMentorInviteResult,
  type AcceptMentorInviteErrorCode,
} from "@/lib/mentor/invite";
import {
  darkInviteDebriefLine,
  type MenteeReads,
} from "@/lib/mentor/mentee-reads";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const primaryLinkClass =
  "block w-full rounded border px-7 py-4 text-center text-sm font-semibold tracking-wide no-underline transition-opacity hover:opacity-90";

const primaryLinkStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
} as const;

const secondaryLinkClass =
  "block w-full rounded border px-7 py-4 text-center text-sm font-semibold tracking-wide no-underline transition-colors";

const secondaryLinkStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  color: "var(--sc-ink-mid)",
  borderColor: "var(--sc-rule)",
} as const;

export type InviteSeatType = MentorSeatType;

type InviteAcceptPanelProps = {
  token: string;
  mentorName: string;
  seatType: InviteSeatType;
  menteeReads: MenteeReads;
  loggedIn: boolean;
};

type AcceptErrorView = "self_invite" | "already_mentored" | "email_mismatch";

type Step = { title: string; body: string };

async function clearInviteCookie(): Promise<void> {
  try {
    await fetch("/mentor/accept/clear", { method: "POST" });
  } catch (err) {
    console.error("clear mentor_invite cookie failed", err);
  }
}

/**
 * Seat mechanics as the preacher experiences them. Deliberately says nothing
 * about whose seat is being drawn down — that is billing, and it is the
 * mentor's business, not theirs.
 */
function stepsFor(
  seatType: MentorSeatType,
  mentorName: string,
  menteeReads: MenteeReads,
): Step[] {
  if (seatType === "debrief") {
    if (menteeReads === "none") {
      return [
        {
          title: "Submit your sermon",
          body: "You can submit up to 2 sermons each month.",
        },
        {
          title: "Talk it through",
          body: darkInviteDebriefLine(mentorName),
        },
      ];
    }
    return [
      {
        title: "Submit your sermon",
        body: "You can submit up to 2 sermons each month.",
      },
      {
        title: "Get coached",
        body: "Each submission produces a coaching debrief and How It Preaches report.",
      },
      {
        title: "Get honest feedback",
        body: `${mentorName} evaluates your preaching against the Sermon Coach rubric.`,
      },
      {
        title: "Talk it through",
        body: `Your full evaluation stays private until ${mentorName} has had the opportunity to discuss it with you.`,
      },
      {
        title: "Keep growing",
        body: "When your coaching relationship ends, your evaluations are released to you.",
      },
    ];
  }

  return [
    {
      title: "Submit your sermon",
      body: "You can submit up to 4 sermons each month.",
    },
    {
      title: "Get coached",
      body: "Each submission produces a coaching debrief and How It Preaches report.",
    },
    {
      title: "Get honest feedback",
      body: `${mentorName} evaluates your preaching against the Sermon Coach rubric.`,
    },
    {
      title: "See everything",
      body: "Your full evaluation, including your score, is yours the moment it is ready.",
    },
    {
      title: "Keep growing",
      body: "Every report stays in your library, and you keep it.",
    },
  ];
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-6 space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4 sm:gap-5">
          <span
            aria-hidden="true"
            className="shrink-0 text-[15px] font-semibold leading-7 tabular-nums"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p
              className="text-[18px] font-semibold leading-snug tracking-tight"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {step.title}
            </p>
            <p
              className="mt-1 text-[15px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
            >
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Callout({
  seatType,
  mentorName,
  menteeReads,
}: {
  seatType: MentorSeatType;
  mentorName: string;
  menteeReads: MenteeReads;
}) {
  if (menteeReads === "none") {
    return null;
  }
  const heading =
    seatType === "debrief"
      ? "Honest feedback. Real conversation."
      : "Honest feedback. Nothing held back.";

  return (
    <div
      className="mt-9 rounded px-6 py-6"
      style={{ background: "var(--sc-accent-pale)" }}
    >
      <p
        className="text-[17px] font-semibold leading-snug tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {heading}
      </p>
      {seatType === "debrief" ? (
        <>
          <p
            className="mt-3 text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Your evaluation may identify areas where you need to grow.{" "}
            {mentorName} will talk through those with you before you read the
            evaluation yourself.
          </p>
          <p
            className="mt-3 text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Nothing is hidden from you permanently. It&rsquo;s simply held until
            the conversation happens.
          </p>
        </>
      ) : (
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          You read everything {mentorName} reads, at the same time they read it,
          including your score.
        </p>
      )}
    </div>
  );
}

/** Shared frame for the terminal states, so they match the invitation itself. */
function Notice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[28px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {title}
      </h1>
      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {children}
      </p>
    </div>
  );
}

export function InviteAcceptPanel({
  token,
  mentorName,
  seatType,
  menteeReads,
  loggedIn,
}: InviteAcceptPanelProps) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptErrorView, setAcceptErrorView] =
    useState<AcceptErrorView | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  async function handleAccept() {
    setGenericError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("accept_mentor_invite", {
      p_token: token,
    });
    setLoading(false);

    if (rpcError) {
      setGenericError("Something went wrong. Please try again.");
      return;
    }

    const result = parseAcceptMentorInviteResult(data);
    if (result.ok) {
      await clearInviteCookie();
      setAccepted(true);
      return;
    }

    const code = result.error_code as AcceptMentorInviteErrorCode | null;

    if (code === "not_authenticated") {
      console.error(
        "accept_mentor_invite returned not_authenticated on /invite page",
      );
      setGenericError("Something went wrong. Please try again.");
      return;
    }

    if (code === "self_invite" || code === "already_mentored") {
      await clearInviteCookie();
      setAcceptErrorView(code);
      return;
    }

    if (code === "email_mismatch") {
      setAcceptErrorView("email_mismatch");
      return;
    }

    if (code === "no_seat_capacity") {
      await clearInviteCookie();
      setGenericError(messageForAcceptError("no_seat_capacity"));
      return;
    }

    if (code) {
      await clearInviteCookie();
    }

    if (code === "invalid_or_used") {
      // Token went stale between preview and accept.
      window.location.reload();
      return;
    }

    setGenericError("Something went wrong. Please try again.");
  }

  if (acceptErrorView === "self_invite") {
    return (
      <Notice title="That’s your own invitation">
        You can&rsquo;t be your own mentee. Send this link to the person you are
        developing.
      </Notice>
    );
  }

  if (acceptErrorView === "already_mentored") {
    return (
      <Notice title="You already have a mentor">
        Someone is already reading your work here. One mentor at a time, so this
        invitation can&rsquo;t be accepted until that relationship ends.
      </Notice>
    );
  }

  if (acceptErrorView === "email_mismatch") {
    return (
      <Notice title="This invitation was sent to a different email address">
        Sign in with the address your mentor used, or ask them to send a new
        invitation to the address you use here.
      </Notice>
    );
  }

  if (accepted) {
    const successBody =
      menteeReads === "none"
        ? darkInviteDebriefLine(mentorName)
        : seatType === "debrief"
          ? `You are connected. Submit sermons the way you normally would. ${mentorName} reads every debrief, and your full evaluations stay private until they have had the chance to talk them through with you.`
          : `You are connected. Submit sermons the way you normally would. ${mentorName} reads everything you read, at the same time you read it.`;

    return (
      <div className="space-y-5 text-center">
        <AuthMessage variant="success">
          You are now connected with your mentor.
        </AuthMessage>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {successBody}
        </p>

        {/* Accepting requires a session, so the dashboard is always reachable
            from here. Without this the invitee lands on a dead end. */}
        <div className="flex flex-col gap-4 pt-1 text-left">
          <Link
            href="/dashboard"
            className={primaryLinkClass}
            style={primaryLinkStyle}
          >
            Go to your dashboard
          </Link>
          <Link
            href="/dashboard/sermons/new"
            className={secondaryLinkClass}
            style={secondaryLinkStyle}
          >
            Submit your first sermon
          </Link>
        </div>
      </div>
    );
  }

  const seatName = mentorSeatDisplayName(seatType);

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        {seatName}
      </p>
      <p
        className="mt-2 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        A personal coaching relationship with {mentorName}.
      </p>

      <h1
        className="mt-7 text-[28px] font-semibold leading-[1.2] tracking-tight sm:text-[32px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {mentorName} is inviting you into Sermon Coaching
      </h1>
      <p
        className="mt-4 text-[17px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {seatType === "debrief"
          ? menteeReads === "none"
            ? darkInviteDebriefLine(mentorName)
            : `${mentorName} will read your sermons, give you honest feedback, and help you become a stronger preacher.`
          : `${mentorName} will read your sermons alongside you, give you honest feedback, and help you become a stronger preacher.`}
      </p>

      <section
        className="mt-10 border-t pt-8"
        style={{ borderColor: "var(--sc-rule)" }}
        aria-labelledby="what-happens-heading"
      >
        <h2
          id="what-happens-heading"
          className="text-[22px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Here&rsquo;s what happens
        </h2>
        <StepList steps={stepsFor(seatType, mentorName, menteeReads)} />
      </section>

      <Callout
        seatType={seatType}
        mentorName={mentorName}
        menteeReads={menteeReads}
      />

      <p
        className="mt-8 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Your {seatName} seat is provided by {mentorName}.
        <br />
        There is nothing for you to purchase.
      </p>

      {genericError ? (
        <div className="mt-6">
          <AuthMessage variant="error">{genericError}</AuthMessage>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4">
        {loggedIn ? (
          <AuthSubmit
            type="button"
            disabled={loading}
            onClick={() => void handleAccept()}
          >
            {loading ? "Accepting…" : `Accept the ${seatName} invitation`}
          </AuthSubmit>
        ) : (
          <Link
            href={mentorAcceptCarryPath(token)}
            className={primaryLinkClass}
            style={primaryLinkStyle}
          >
            Create an account to accept
          </Link>
        )}

        <Link
          href={CANONICAL_SITE_ORIGIN}
          className={secondaryLinkClass}
          style={secondaryLinkStyle}
        >
          Not right now
        </Link>
      </div>
    </div>
  );
}
