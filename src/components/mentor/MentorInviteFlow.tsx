"use client";

import { useState, type ReactNode } from "react";
import { AuthField } from "@/components/auth/AuthForm";
import { AuthMessage } from "@/components/auth/AuthMessage";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { browserSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/client";
import {
  availableSeatTypes,
  totalHeldSeats,
} from "@/components/mentor/seat-availability";
import { MentorSeatPicker } from "@/components/mentor/MentorSeatPicker";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const SEAT_CAP_SQLSTATE = "P0001";

/** Five or more seats is where the hand-invoiced Classroom product starts. */
const CLASSROOM_THRESHOLD = 5;

function isSeatCapError(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === SEAT_CAP_SQLSTATE && message.includes("seat limit reached")
  );
}

/* ------------------------------------------------------------------ shell */

function PrimaryButton({
  children,
  disabled,
  onClick,
  full,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded border px-7 py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
        full ? "w-full sm:w-auto" : ""
      }`}
      style={{
        ...uiFont,
        background: "var(--sc-ink)",
        color: "var(--sc-bg)",
        borderColor: "var(--sc-ink)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MenteeReadsOptions({
  value,
  disabled,
  onChange,
}: {
  value: "debrief" | "none";
  disabled?: boolean;
  onChange: (next: "debrief" | "none") => void;
}) {
  const options: Array<{ id: "debrief" | "none"; label: string }> = [
    {
      id: "debrief",
      label: "They read the coaching debrief and How It Preaches",
    },
    {
      id: "none",
      label: "They read nothing. You deliver it in person.",
    },
  ];

  return (
    <div className="mt-4 space-y-2" role="radiogroup">
      {options.map((option) => {
        const checked = value === option.id;
        return (
          <label
            key={option.id}
            className="flex cursor-pointer items-start gap-2 text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            <input
              type="radio"
              name="mentee-reads"
              value={option.id}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(option.id)}
              className="mt-1 shrink-0"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function QuietButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-4 hover:underline"
      style={{ ...uiFont, color: "var(--sc-ink-soft)", cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  lede,
  onClose,
  children,
}: {
  title: string;
  lede?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded px-6 py-6 text-left sm:px-8 sm:py-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
      }}
    >
      <div className="mb-7 flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h2
            className="text-[26px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {title}
          </h2>
          {lede ? (
            <p
              className="mt-2 max-w-xl text-[15px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
            >
              {lede}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 pt-1">
          <QuietButton onClick={onClose}>Close</QuietButton>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------- step 1: choose a seat */

function SeatChoice({
  capacity,
  onClose,
}: {
  capacity: MentorSeatCapacity;
  onClose: () => void;
}) {
  const atClassroomScale = totalHeldSeats(capacity) >= CLASSROOM_THRESHOLD;

  return (
    <Panel title="Who are you developing?" onClose={onClose}>
      <MentorSeatPicker showCancel={false} />

      {atClassroomScale ? (
        <p
          className="mt-7 border-t pt-5 text-[13px] leading-relaxed"
          style={{
            ...uiFont,
            color: "var(--sc-ink-soft)",
            borderColor: "var(--sc-rule)",
          }}
        >
          Running five or more seats? Classroom bills a whole cohort on one
          invoice for a term.{" "}
          <a
            href="mailto:chris@sermoncoach.com?subject=Classroom%20interest"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--sc-accent)" }}
          >
            Tell us about your class
          </a>
          .
        </p>
      ) : null}
    </Panel>
  );
}

/* --------------------------------------------- step 3: invite by email */

function InviteByEmail({
  seatTypes,
  displayName,
  onDisplayNameSaved,
  onClose,
  isTeamAccount = false,
}: {
  seatTypes: MentorSeatType[];
  displayName: string | null;
  onDisplayNameSaved: (name: string) => void;
  onClose: () => void;
  isTeamAccount?: boolean;
}) {
  const [seatType, setSeatType] = useState<MentorSeatType>(seatTypes[0]);
  const [menteeReads, setMenteeReads] = useState<"debrief" | "none">("debrief");
  const [preacherName, setPreacherName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const needsName = displayName == null;

  async function handleSaveName() {
    setNameError(null);
    setNameSaving(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("set_display_name", {
      p_display_name: nameDraft,
    });
    setNameSaving(false);

    if (rpcError) {
      setNameError(rpcError.message);
      return;
    }
    const saved = typeof data === "string" ? data.trim() : "";
    if (!saved) {
      setNameError("Could not save your name. Please try again.");
      return;
    }
    onDisplayNameSaved(saved);
    setNameDraft("");
  }

  /**
   * One button, two calls: mint the invite, then email it. The link is kept in
   * state so a send failure still leaves the mentor something to paste.
   */
  async function handleSend() {
    if (sending) return;
    setError(null);
    setSending(true);

    try {
      const supabase = createClient();
      let token = inviteLink ? inviteLink.split("/invite/")[1] : null;

      if (!token) {
        const label = preacherName.trim();
        // p_mentor_label is optional. Checkout will later pass the same
        // value through Stripe session metadata into this column; it is
        // not form-only.
        const { data, error: rpcError } = await supabase.rpc(
          "create_mentor_invite",
          {
            p_seat_type: seatType,
            p_mentor_label: label.length > 0 ? label : null,
            p_mentee_reads:
              seatType === "debrief" && menteeReads === "none"
                ? "none"
                : null,
          },
        );

        if (rpcError) {
          setError(
            isSeatCapError(rpcError)
              ? "That seat was taken while you were here. Close this and start again to add another."
              : rpcError.message.toLowerCase().includes("not authenticated")
                ? "Sign in to create an invitation."
                : "Could not create an invitation. Please try again.",
          );
          return;
        }

        const minted = typeof data === "string" ? data.trim() : "";
        if (!minted) {
          setError("Could not create an invitation. Please try again.");
          return;
        }
        token = minted;
        setInviteLink(`${browserSiteOrigin()}/invite/${minted}`);
      }

      const response = await fetch("/api/mentor/invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, to: email.trim() }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        sent_to?: string;
      };

      if (response.status === 503 && payload.error === "email_not_configured") {
        setError(
          "Email is not configured on the server. Copy the link below and send it yourself.",
        );
        return;
      }
      if (payload.error === "rate_limited" && payload.message) {
        setError(payload.message);
        return;
      }
      if (payload.error === "already_sent") {
        if (typeof payload.sent_to === "string") setSentTo(payload.sent_to);
        setError("This invitation was already emailed.");
        return;
      }
      if (payload.error === "display_name_required") {
        setError("Add your name before sending an invitation by email.");
        return;
      }
      if (!response.ok || !payload.ok) {
        if (payload.error === "invalid_email") {
          setError("Enter a valid email address.");
          return;
        }
        if (payload.error === "send_failed" && payload.message) {
          setError(payload.message);
          return;
        }
        setError("Could not send the invitation. Please try again.");
        return;
      }

      if (typeof payload.sent_to === "string") {
        setSentTo(payload.sent_to);
      }
    } catch {
      setError("Could not send the invitation. Please try again.");
    } finally {
      setSending(false);
    }
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

  if (sentTo) {
    return (
      <Panel title="Invitation sent" onClose={onClose}>
        <AuthMessage variant="success">
          Sent to {sentTo}. Nothing happens until they accept.
        </AuthMessage>
        <p
          className="mt-5 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {isTeamAccount
            ? "They will appear under Your preachers once they create an account."
            : "They will appear under Your Preachers once they create an account."}
          Church spam filters can be slow — if they do not see it in a few
          minutes, send them the link directly.
        </p>
        {inviteLink ? (
          <div className="mt-5">
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
            <div className="mt-3">
              <QuietButton onClick={() => void handleCopy()}>
                {copied ? "Copied" : "Copy link"}
              </QuietButton>
            </div>
          </div>
        ) : null}
      </Panel>
    );
  }

  if (needsName) {
    const nameEmpty = nameDraft.trim().length === 0;
    return (
      <Panel
        title="What should your preacher see?"
        lede="Your invitation carries your name. Without one it reads “your mentor,” which is vaguer than you want when asking someone to hand over a sermon."
        onClose={onClose}
      >
        {nameError ? <AuthMessage variant="error">{nameError}</AuthMessage> : null}
        <div className="max-w-sm">
          <AuthField
            id="display-name"
            label="Your name"
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
        </div>
        <div className="mt-6">
          <PrimaryButton
            disabled={nameEmpty || nameSaving}
            onClick={() => void handleSaveName()}
          >
            {nameSaving ? "Saving…" : "Save and continue"}
          </PrimaryButton>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Invite a preacher"
      lede="Name the preacher you’re developing, then send the invitation to their email."
      onClose={onClose}
    >
      {seatTypes.length > 1 ? (
        <div className="mb-6">
          <p
            className="mb-2 text-[13px] font-medium"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            Which seat?
          </p>
          <div className="flex flex-col gap-3" role="radiogroup">
            {seatTypes.map((type) => {
              const isSelected = seatType === type;
              return (
                <div
                  key={type}
                  className="rounded border px-4 py-3"
                  style={{
                    background: isSelected
                      ? "var(--sc-accent-pale)"
                      : "var(--sc-panel)",
                    borderColor: isSelected
                      ? "var(--sc-accent)"
                      : "var(--sc-rule)",
                  }}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSeatType(type);
                      if (type !== "debrief") {
                        setMenteeReads("debrief");
                      }
                    }}
                    className="w-full rounded border-0 bg-transparent p-0 text-left text-[13px] font-semibold"
                    style={{
                      ...uiFont,
                      color: "var(--sc-ink)",
                      cursor: "pointer",
                    }}
                  >
                    {mentorSeatDisplayName(type)}
                  </button>
                  {type === "debrief" && isSelected ? (
                    <MenteeReadsOptions
                      value={menteeReads}
                      disabled={sending}
                      onChange={setMenteeReads}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p
            className="text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Using your available {mentorSeatDisplayName(seatType)} seat.
          </p>
          {seatType === "debrief" ? (
            <div
              className="mt-4 rounded border px-4 py-3"
              style={{
                background: "var(--sc-panel)",
                borderColor: "var(--sc-rule)",
              }}
            >
              <p
                className="text-[13px] font-semibold"
                style={{ ...uiFont, color: "var(--sc-ink)" }}
              >
                {mentorSeatDisplayName("debrief")}
              </p>
              <MenteeReadsOptions
                value={menteeReads}
                disabled={sending}
                onChange={setMenteeReads}
              />
            </div>
          ) : null}
        </div>
      )}

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <div className="mt-4 max-w-sm space-y-5">
        <AuthField
          id="invite-preacher-name"
          label="The preacher’s name (optional)"
          inputProps={{
            name: "invite-preacher-name",
            type: "text",
            autoComplete: "name",
            maxLength: 80,
            placeholder: "James",
            value: preacherName,
            disabled: sending,
            onChange: (e) => setPreacherName(e.target.value),
          }}
        />
        <AuthField
          id="invite-recipient-email"
          label="Email address"
          inputProps={{
            name: "invite-recipient-email",
            type: "email",
            autoComplete: "email",
            value: email,
            disabled: sending,
            onChange: (e) => setEmail(e.target.value),
          }}
        />
      </div>

      <div className="mt-6">
        <PrimaryButton
          disabled={sending || email.trim().length === 0}
          onClick={() => void handleSend()}
        >
          {sending ? "Sending…" : "Send invitation"}
        </PrimaryButton>
      </div>

      {inviteLink && !sentTo ? (
        <div className="mt-6">
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
          <div className="mt-3">
            <QuietButton onClick={() => void handleCopy()}>
              {copied ? "Copied" : "Copy link instead"}
            </QuietButton>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

/* --------------------------------------------------------------- entry */

export function MentorInviteFlow({
  capacity,
  initialDisplayName,
  label = "Invite a preacher",
  defaultOpen = false,
  heading,
  children,
  isTeamAccount = false,
}: {
  capacity: MentorSeatCapacity;
  initialDisplayName: string | null;
  label?: string;
  defaultOpen?: boolean;
  heading?: ReactNode;
  children?: ReactNode;
  isTeamAccount?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [displayName, setDisplayName] = useState(initialDisplayName);

  const available = availableSeatTypes(capacity);
  const hasSeat = available.length > 0;

  const trigger = open ? null : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex w-full items-center justify-center gap-2 rounded border px-7 py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 sm:w-auto"
      style={{
        ...uiFont,
        background: "var(--sc-ink)",
        color: "var(--sc-bg)",
        borderColor: "var(--sc-ink)",
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true">+</span>
      {label}
    </button>
  );

  const panel = open ? (
    hasSeat ? (
      <InviteByEmail
        seatTypes={available}
        displayName={displayName}
        onDisplayNameSaved={setDisplayName}
        onClose={() => setOpen(false)}
        isTeamAccount={isTeamAccount}
      />
    ) : (
      <SeatChoice capacity={capacity} onClose={() => setOpen(false)} />
    )
  ) : null;

  if (heading) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {heading}
          {trigger}
        </div>
        {panel ? <div className="mt-7">{panel}</div> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </>
    );
  }

  // With a seat in hand, go straight to the email form. Without one, the seat
  // has to be bought first — no point collecting an address we cannot use yet.
  return (
    <>
      {trigger}
      {panel}
    </>
  );
}
