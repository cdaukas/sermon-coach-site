"use client";

import { useState } from "react";
import {
  AuthField,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { createClient } from "@/lib/supabase/client";
import { browserSiteOrigin } from "@/lib/site-origin";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const SEAT_CAP_SQLSTATE = "P0001";
const SEAT_CAP_MESSAGE =
  "seat limit reached: a mentor may hold at most 4 seats";

type SeatType = "debrief" | "evaluation";

type MentorInvitePanelProps = {
  initialDisplayName: string | null;
};

const SEAT_OPTIONS = [
  {
    value: "debrief" as const,
    title: "Debrief seat · $12/mo",
    body: "Four debriefs a month. No score. His evaluations run but stay held until you release one, which you can do once every 90 days.",
    caption: "Start here for anyone in their first few years of preaching.",
  },
  {
    value: "evaluation" as const,
    title: "Evaluation seat · $25/mo",
    body: "Four evaluations and four debriefs a month. Nothing held. He sees every score when you do.",
    caption: "For a preacher who is ready to be measured against the rubric.",
  },
] as const;

function isSeatCapError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === SEAT_CAP_SQLSTATE &&
    (error.message ?? "").includes(SEAT_CAP_MESSAGE)
  );
}

export function MentorInvitePanel({
  initialDisplayName,
}: MentorInvitePanelProps) {
  const [displayName, setDisplayName] = useState<string | null>(
    initialDisplayName,
  );
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [promptOpen, setPromptOpen] = useState(initialDisplayName == null);
  const [skippedName, setSkippedName] = useState(false);

  const [seatType, setSeatType] = useState<SeatType | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [capBlocked, setCapBlocked] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const needsName = displayName == null;

  async function handleSaveName() {
    setNameError(null);
    setNameSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_display_name", {
      p_display_name: nameDraft,
    });
    setNameSaving(false);

    if (error) {
      setNameError(error.message);
      return;
    }

    const saved = typeof data === "string" ? data.trim() : "";
    if (!saved) {
      setNameError("Could not save your display name. Please try again.");
      return;
    }

    setDisplayName(saved);
    setPromptOpen(false);
    setSkippedName(false);
    setNameDraft("");
  }

  function handleSkipName() {
    setPromptOpen(false);
    setSkippedName(true);
    setNameError(null);
  }

  async function handleCreateInvite() {
    if (!seatType) return;

    setCreateError(null);
    setCapBlocked(false);
    setCopied(false);
    setCreating(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_mentor_invite", {
      p_seat_type: seatType,
    });
    setCreating(false);

    if (rpcError) {
      setInviteLink(null);
      if (isSeatCapError(rpcError)) {
        setCapBlocked(true);
        return;
      }
      setCreateError(
        rpcError.message.toLowerCase().includes("not authenticated")
          ? "Sign in to create an invitation."
          : "Could not create an invitation. Please try again.",
      );
      return;
    }

    const token = typeof data === "string" ? data.trim() : "";
    if (!token) {
      setInviteLink(null);
      setCreateError("Could not create an invitation. Please try again.");
      return;
    }

    setInviteLink(`${browserSiteOrigin()}/invite/${token}`);
  }

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (inviteLink) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-[28px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Invite ready
          </h2>
          <p
            className="mt-3 text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Send this link to the person you are inviting. It works once, and
            only for the person who opens it and creates an account.
          </p>
        </div>

        <div className="space-y-2">
          <p
            className="text-[13px] font-medium"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Invite link
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
            {inviteLink}
          </p>
        </div>

        <AuthSubmit type="button" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy link"}
        </AuthSubmit>

        <p
          className="text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Nothing happens until he accepts. You will see him appear here when he
          does.
        </p>
      </div>
    );
  }

  if (needsName && promptOpen) {
    const nameEmpty = nameDraft.trim().length === 0;

    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-[28px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            What should your mentee see?
          </h2>
          <p
            className="mt-3 text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Your invite will carry your name. Without one it reads &quot;a
            preacher you know,&quot; which is vaguer than you probably want when
            you are asking someone to hand over a sermon.
          </p>
        </div>

        {nameError ? (
          <AuthMessage variant="error">{nameError}</AuthMessage>
        ) : null}

        <AuthField
          id="display-name"
          label="Display name"
          inputProps={{
            name: "display-name",
            type: "text",
            autoComplete: "name",
            maxLength: 80,
            placeholder: "Chris Daukas",
            value: nameDraft,
            onChange: (e) => setNameDraft(e.target.value),
          }}
        />
        <p
          className="-mt-3 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Whatever they call you. First name is fine.
        </p>

        <div className="flex flex-col gap-3">
          <AuthSubmit
            type="button"
            disabled={nameEmpty || nameSaving}
            onClick={() => void handleSaveName()}
          >
            {nameSaving ? "Saving…" : "Save and continue"}
          </AuthSubmit>
          <AuthSubmit
            type="button"
            variant="secondary"
            disabled={nameSaving}
            onClick={handleSkipName}
          >
            Skip for now
          </AuthSubmit>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {needsName && skippedName ? (
        <p
          className="text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Your invite will say &quot;a preacher you know.&quot; You can add your
          name from this page any time.
        </p>
      ) : null}

      {needsName ? (
        <p className="text-[14px]" style={{ ...uiFont }}>
          <button
            type="button"
            onClick={() => {
              setPromptOpen(true);
              setNameError(null);
            }}
            className="border-0 bg-transparent p-0 text-[14px] font-medium underline-offset-2 hover:underline"
            style={{ ...uiFont, color: "var(--sc-accent)", cursor: "pointer" }}
          >
            Add your name
          </button>
        </p>
      ) : null}

      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Seat type"
      >
        {SEAT_OPTIONS.map((option) => {
          const selected = seatType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSeatType(option.value)}
              className="rounded border px-5 py-4 text-left transition-colors"
              style={{
                ...uiFont,
                background: selected
                  ? "var(--sc-accent-pale)"
                  : "var(--sc-panel)",
                borderColor: selected ? "var(--sc-accent)" : "var(--sc-rule)",
                boxShadow: selected ? "var(--sc-shadow-lift)" : "none",
              }}
            >
              <p
                className="text-[15px] font-semibold"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {option.title}
              </p>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ color: "var(--sc-ink-soft)" }}
              >
                {option.body}
              </p>
              <p
                className="mt-3 text-[12px] leading-relaxed"
                style={{ color: "var(--sc-ink-soft)" }}
              >
                {option.caption}
              </p>
            </button>
          );
        })}
      </div>

      <p
        className="text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        You can move someone from debrief to evaluation later. Moving up
        releases everything being held.
      </p>

      {capBlocked ? (
        <div
          className="space-y-3 rounded px-4 py-3 text-sm leading-relaxed"
          role="alert"
          style={{
            ...uiFont,
            background: "var(--sc-error-bg)",
            color: "var(--sc-error)",
            border: "1px solid rgba(155, 44, 44, 0.25)",
          }}
        >
          <p>
            You are holding four seats, which is the limit. End a relationship
            to free one up.
          </p>
          <p>
            If you need a fifth, that is Classroom. It is built for schools,
            denominations, and networks that need one invoice for a term instead
            of a personal card each month.
          </p>
        </div>
      ) : null}

      {createError ? (
        <AuthMessage variant="error">{createError}</AuthMessage>
      ) : null}

      <AuthSubmit
        type="button"
        disabled={!seatType || creating}
        onClick={() => void handleCreateInvite()}
      >
        {creating ? "Creating…" : "Create invite"}
      </AuthSubmit>
    </div>
  );
}
