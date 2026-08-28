"use client";

import { useState } from "react";
import { MentorInvitePanel } from "@/components/mentor/MentorInvitePanel";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/**
 * The invite flow itself is unchanged — MentorInvitePanel owns every bit of it.
 * This only defers it behind the page's primary call to action so the page
 * opens on the people, not on a form.
 */
export function MentorInviteLauncher({
  initialDisplayName,
  variant = "primary",
  label = "Invite a preacher",
}: {
  initialDisplayName: string | null;
  variant?: "primary" | "quiet";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "primary"
            ? "inline-flex items-center gap-2 rounded border px-7 py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
            : "inline-flex items-center gap-2 rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide transition-colors"
        }
        style={{
          ...uiFont,
          background:
            variant === "primary" ? "var(--sc-ink)" : "var(--sc-panel)",
          color:
            variant === "primary" ? "var(--sc-bg)" : "var(--sc-ink-mid)",
          borderColor:
            variant === "primary" ? "var(--sc-ink)" : "var(--sc-rule)",
          cursor: "pointer",
        }}
      >
        <span aria-hidden="true">+</span>
        {label}
      </button>
    );
  }

  return (
    <div
      className="rounded px-6 py-6 text-left sm:px-8 sm:py-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
      }}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="text-[24px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Invite a preacher
          </h2>
          <p
            className="mt-2 max-w-xl text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
          >
            They preach. You read. The seat is yours, not theirs, and you can
            end it whenever the season is over.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-4 hover:underline"
          style={{ ...uiFont, color: "var(--sc-ink-soft)", cursor: "pointer" }}
        >
          Close
        </button>
      </div>

      <MentorInvitePanel initialDisplayName={initialDisplayName} />
    </div>
  );
}
