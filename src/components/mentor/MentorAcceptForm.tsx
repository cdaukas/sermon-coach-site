"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthSubmit } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";
import {
  messageForAcceptError,
  parseAcceptMentorInviteResult,
  type AcceptMentorInviteErrorCode,
} from "@/lib/mentor/invite";

const uiFont = { fontFamily: "var(--font-ui)" };

type MentorAcceptFormProps = {
  token: string;
};

async function clearInviteCookie(): Promise<void> {
  try {
    await fetch("/mentor/accept/clear", { method: "POST" });
  } catch (err) {
    console.error("clear mentor_invite cookie failed", err);
  }
}

export function MentorAcceptForm({ token }: MentorAcceptFormProps) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("accept_mentor_invite", {
      p_token: token,
    });
    setLoading(false);

    if (rpcError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    const result = parseAcceptMentorInviteResult(data);
    if (result.ok) {
      await clearInviteCookie();
      setAccepted(true);
      return;
    }

    // Definitive rejections: drop the cookie so /start does not re-loop here.
    if (result.error_code) {
      await clearInviteCookie();
    }

    setError(
      messageForAcceptError(
        result.error_code as AcceptMentorInviteErrorCode | null,
      ),
    );
  }

  if (accepted) {
    return (
      <div className="space-y-4 text-center">
        <AuthMessage variant="success">
          You are now connected with your mentor.
        </AuthMessage>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          When you submit sermons, your mentor will be able to see debriefs and
          can request a full evaluation. You can keep using Sermon Coach as you
          normally would.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="space-y-3 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        <p>
          You are accepting an invitation to be mentored through Sermon Coach.
        </p>
        <p>By accepting, you agree that your mentor will be able to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>See mentoring debriefs of sermons you submit</li>
          <li>Request a full evaluation of a sermon you submit</li>
        </ul>
        <p>
          This is consensual and invite-based. You can only have one active
          mentor at a time. If that is not what you want, close this page and
          do not accept.
        </p>
      </div>

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <AuthSubmit
        type="button"
        disabled={loading}
        onClick={() => void handleAccept()}
      >
        {loading ? "Accepting…" : "Accept invitation"}
      </AuthSubmit>
    </div>
  );
}
