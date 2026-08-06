import Link from "next/link";
import {
  buildCheckoutPath,
  buildMentorSeatCheckoutPath,
} from "@/lib/billing/checkout";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export type EmptyLibraryKind =
  | "free"
  | "pack"
  | "subscription"
  /** Zero seats + zero credits; not depleted — offers mentor seats OR Coach. */
  | "chooser";

type EmptyLibraryCardProps = {
  kind: EmptyLibraryKind;
  packName?: string;
  packCredits?: number;
};

export function EmptyLibraryCard({
  kind,
  packName,
  packCredits,
}: EmptyLibraryCardProps) {
  if (kind === "chooser") {
    return (
      <div
        className="text-center"
        style={{
          background: "#ffffff",
          boxShadow: "var(--sc-shadow)",
          borderRadius: 4,
          padding: "46px 40px",
        }}
      >
        {/* PLACEHOLDER COPY — Chris rewrites before open allowlist */}
        <h2
          className="m-0 font-semibold"
          style={{ ...serifFont, fontSize: 25, color: "#1a2332" }}
        >
          [PLACEHOLDER] Two ways to start
        </h2>
        <p
          className="mx-auto mt-3 mb-0 leading-relaxed"
          style={{
            ...uiFont,
            fontSize: 14,
            color: "#4a5568",
            maxWidth: 440,
          }}
        >
          [PLACEHOLDER] You are not out of credits. Buy seats to develop other
          preachers, or Coach to evaluate your own sermons — either, both, or
          neither for now.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={buildMentorSeatCheckoutPath("debrief")}
            className="inline-block rounded border px-6 py-3.5 text-sm font-semibold tracking-wide no-underline transition-all"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            [PLACEHOLDER] Mentoring seats
          </Link>
          <Link
            href={buildCheckoutPath("monthly")}
            className="inline-block rounded border px-6 py-3.5 text-sm font-semibold tracking-wide no-underline transition-all"
            style={{
              ...uiFont,
              background: "transparent",
              color: "var(--sc-ink)",
              borderColor: "var(--sc-rule)",
            }}
          >
            [PLACEHOLDER] Coach for yourself
          </Link>
        </div>

        <p
          className="mx-auto mt-6 mb-0 leading-relaxed"
          style={{
            ...uiFont,
            fontSize: 13,
            color: "#4a5568",
            maxWidth: 420,
          }}
        >
          [PLACEHOLDER] {mentorSeatDisplayName("debrief")} $12/mo ·{" "}
          {mentorSeatDisplayName("evaluation")} $25/mo · Coach subscription for
          your own evaluations
        </p>
      </div>
    );
  }

  let heading: string;
  let body: string;
  let ctaLabel: string;

  if (kind === "pack") {
    heading = `${packName ?? "Pack"} is yours`;
    body = `${packCredits ?? 0} credits, good for 18 months. Use them whenever you step into the pulpit.`;
    ctaLabel = "Submit your first sermon";
  } else if (kind === "subscription") {
    heading = "You're on Coach";
    body =
      "Ten credits every month, enough to run every sermon you preach, even in a five-Sunday month. They reset on the first.";
    ctaLabel = "Submit your first sermon";
  } else {
    heading = "Nothing here yet";
    body =
      "Paste a manuscript or a transcript and you will get the full evaluation back. Your first one is free.";
    ctaLabel = "Submit your first sermon";
  }

  return (
    <div
      className="text-center"
      style={{
        background: "#ffffff",
        boxShadow: "var(--sc-shadow)",
        borderRadius: 4,
        padding: "46px 40px",
      }}
    >
      <h2
        className="m-0 font-semibold"
        style={{ ...serifFont, fontSize: 25, color: "#1a2332" }}
      >
        {heading}
      </h2>
      <p
        className="mx-auto mt-3 mb-0 leading-relaxed"
        style={{
          ...uiFont,
          fontSize: 14,
          color: "#4a5568",
          maxWidth: 400,
        }}
      >
        {body}
      </p>
      <Link
        href="/dashboard/sermons/new"
        className="mt-6 inline-block rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline transition-all"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "var(--sc-bg)",
          borderColor: "var(--sc-ink)",
        }}
      >
        {ctaLabel}
      </Link>
      <p
        className="mx-auto mt-5 mb-0 leading-relaxed"
        style={{
          ...serifFont,
          fontSize: 14,
          fontStyle: "italic",
          color: "#4a5568",
          maxWidth: 400,
        }}
      >
        Preaching this Sunday and still working from an outline?{" "}
        <Link
          href="/dashboard/sketch"
          className="no-underline hover:underline"
          style={{
            ...uiFont,
            fontWeight: 600,
            color: "#a67c2e",
            fontStyle: "normal",
          }}
        >
          Run The Sketch →
        </Link>
      </p>
    </div>
  );
}
