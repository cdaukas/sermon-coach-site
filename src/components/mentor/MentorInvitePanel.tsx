"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthSubmit } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";
import { mentorAcceptPathWithToken } from "@/lib/mentor/invite";
import { browserSiteOrigin } from "@/lib/site-origin";

const uiFont = { fontFamily: "var(--font-ui)" };

export function MentorInvitePanel() {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError(null);
    setCopied(false);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_mentor_invite");
    setLoading(false);

    if (rpcError) {
      setLink(null);
      setError(
        rpcError.message.toLowerCase().includes("not authenticated")
          ? "Sign in to create an invitation."
          : "Could not create an invitation. Please try again.",
      );
      return;
    }

    const token = typeof data === "string" ? data.trim() : "";
    if (!token) {
      setLink(null);
      setError("Could not create an invitation. Please try again.");
      return;
    }

    // Always www in production so invite host matches Supabase Site URL.
    setLink(`${browserSiteOrigin()}${mentorAcceptPathWithToken(token)}`);
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5">
      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        Generate a one-time link and send it to the person you want to mentor.
        When they accept, you will be able to see debriefs of their sermons and
        request a full evaluation.
      </p>

      {error ? (
        <AuthMessage variant="error">{error}</AuthMessage>
      ) : null}

      <AuthSubmit
        type="button"
        disabled={loading}
        onClick={() => void handleCreate()}
      >
        {loading ? "Creating link…" : "Create invitation link"}
      </AuthSubmit>

      {link ? (
        <div className="space-y-3">
          <p
            className="text-[13px] font-medium"
            style={{ ...uiFont, color: "var(--sc-ink)" }}
          >
            Share this link
          </p>
          <p
            className="break-all rounded px-3 py-3 text-[13px] leading-relaxed"
            style={{
              ...uiFont,
              color: "var(--sc-ink-mid)",
              background: "var(--sc-bg)",
              border: "1px solid var(--sc-rule)",
            }}
          >
            {link}
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="text-[13px] font-medium underline-offset-2 hover:underline"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
