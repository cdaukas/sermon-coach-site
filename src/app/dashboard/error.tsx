"use client";

import Link from "next/link";
import { useEffect } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard/error]", error);
  }, [error]);

  return (
    <main className="px-4 py-10 sm:px-8">
      <div
        role="alert"
        className="rounded px-7 py-6"
        style={{
          background: "#ffffff",
          boxShadow: "var(--sc-shadow)",
          borderRadius: 4,
          borderLeft: "3px solid #a04848",
          borderTop: "none",
          borderRight: "none",
          borderBottom: "none",
        }}
      >
        <h1
          className="mb-3 font-semibold leading-tight"
          style={{
            ...serifFont,
            fontSize: 25,
            fontWeight: 600,
            color: "var(--sc-ink)",
          }}
        >
          Your sermons did not load
        </h1>
        <p
          className="mb-6 leading-relaxed"
          style={{
            ...uiFont,
            fontSize: 14,
            color: "#4a5568",
            maxWidth: 400,
          }}
        >
          The list could not be reached just now. Nothing has been lost. Try
          again, and if it keeps happening, email{" "}
          <a
            href="mailto:chris@sermoncoach.com"
            className="underline"
            style={{ color: "var(--sc-accent)" }}
          >
            chris@sermoncoach.com
          </a>{" "}
          and I will look at it personally.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard/sermons/new"
            className="rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide no-underline"
            style={{
              ...uiFont,
              background: "transparent",
              color: "var(--sc-ink)",
              borderColor: "var(--sc-rule)",
            }}
          >
            New evaluation
          </Link>
        </div>
      </div>
    </main>
  );
}
