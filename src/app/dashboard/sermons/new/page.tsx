import type { Metadata } from "next";
import Link from "next/link";
import { SermonForm } from "@/components/dashboard/SermonForm";

export const metadata: Metadata = {
  title: "New Sermon",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default function NewSermonPage() {
  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <Link
        href="/dashboard"
        className="mb-8 inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← Back to library
      </Link>

      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Submit
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          New Sermon
        </h1>
        <p
          className="mt-3 text-base leading-relaxed"
          style={{
            ...serifFont,
            color: "var(--sc-ink-soft)",
            fontStyle: "italic",
          }}
        >
          Select all, copy, and paste your manuscript or transcript below. Don&apos;t
          worry about formatting. Save the sermon, then run an evaluation.
        </p>
      </div>

      <SermonForm />
    </main>
  );
}
