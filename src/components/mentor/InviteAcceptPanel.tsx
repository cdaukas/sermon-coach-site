"use client";

import { useState } from "react";
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
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const primaryLinkClass =
  "block w-full rounded border px-7 py-3.5 text-center text-sm font-semibold tracking-wide no-underline transition-all";

const primaryLinkStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
} as const;

const secondaryLinkClass =
  "block w-full rounded border px-7 py-3.5 text-center text-sm font-semibold tracking-wide no-underline transition-all";

const secondaryLinkStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  color: "var(--sc-ink)",
  borderColor: "var(--sc-rule)",
} as const;

export type InviteSeatType = MentorSeatType;

type InviteAcceptPanelProps = {
  token: string;
  mentorName: string;
  seatType: InviteSeatType;
  loggedIn: boolean;
};

type AcceptErrorView = "self_invite" | "already_mentored";

async function clearInviteCookie(): Promise<void> {
  try {
    await fetch("/mentor/accept/clear", { method: "POST" });
  } catch (err) {
    console.error("clear mentor_invite cookie failed", err);
  }
}

function DebriefDisclosure({ mentorName }: { mentorName: string }) {
  return (
    <div
      className="space-y-3 text-[15px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
    >
      <p>Plainly, so there are no surprises.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Two submissions a month, drawn from {mentorName}&apos;s seat rather
          than your credits.
        </li>
        <li>
          Every submission generates a coaching debrief and How It Preaches. You
          both read those.
        </li>
        <li>
          Every submission is also evaluated in full against the rubric. The
          scored evaluation stays closed to you until {mentorName} releases it.
        </li>
        <li>
          You&apos;ll see that it happened. The date shows up in your history,
          marked closed.
        </li>
        <li>
          When {mentorName} ends the mentoring, every held evaluation opens to
          you.
        </li>
      </ul>
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "var(--sc-ink-soft)" }}
      >
        An evaluation names weaknesses bluntly. A mentor worth having wants to
        say those to you themselves before you read them cold on a screen.
        Nothing is hidden from you permanently. It is held until the conversation
        happens.
      </p>
    </div>
  );
}

function EvaluationDisclosure({ mentorName }: { mentorName: string }) {
  return (
    <div
      className="space-y-3 text-[15px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
    >
      <p>Plainly, so there are no surprises.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Four submissions a month, drawn from {mentorName}&apos;s seat.
        </li>
        <li>
          Every sermon you submit generates a debrief and a full evaluation.
          You both read everything the moment it is ready, including the score.
          Nothing is held back.
        </li>
      </ul>
    </div>
  );
}

export function InviteAcceptPanel({
  token,
  mentorName,
  seatType,
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
      <div className="space-y-4">
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          That&apos;s your own invitation
        </h1>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          You can&apos;t be your own mentee. Send this link to the person you
          are developing.
        </p>
      </div>
    );
  }

  if (acceptErrorView === "already_mentored") {
    return (
      <div className="space-y-4">
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          You already have a mentor
        </h1>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Someone is already reading your work here. One mentor at a time, so
          this invitation can&apos;t be accepted until that relationship ends.
        </p>
      </div>
    );
  }

  if (accepted) {
    const successBody =
      seatType === "debrief"
        ? "You are connected. Submit sermons the way you normally would. Your mentor reads every debrief, and the full evaluations stay closed to you until they open one."
        : "You are connected. Submit sermons the way you normally would. Your mentor reads everything you read, at the same time you read it.";

    return (
      <div className="space-y-4 text-center">
        <AuthMessage variant="success">
          You are now connected with your mentor.
        </AuthMessage>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {successBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {mentorName} wants to read your preaching
      </h1>

      <p
        className="text-[14px] font-medium"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {mentorSeatDisplayName(seatType)} seat
      </p>

      {seatType === "debrief" ? (
        <DebriefDisclosure mentorName={mentorName} />
      ) : (
        <EvaluationDisclosure mentorName={mentorName} />
      )}

      {genericError ? (
        <AuthMessage variant="error">{genericError}</AuthMessage>
      ) : null}

      <div className="flex flex-col gap-3">
        {loggedIn ? (
          <AuthSubmit
            type="button"
            disabled={loading}
            onClick={() => void handleAccept()}
          >
            {loading ? "Accepting…" : "Accept the invitation"}
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
