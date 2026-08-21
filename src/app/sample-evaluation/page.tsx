import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";
import { getPublicSampleEvaluation } from "@/lib/evaluation/public-sample";
import "@/app/evaluation-print.css";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export const metadata: Metadata = {
  title: "Sample Evaluation",
  description:
    "A full Sermon Coach evaluation of a real sermon, shown as a public sample.",
  alternates: { canonical: "/sample-evaluation" },
  robots: {
    index: true,
    follow: true,
  },
};

/** Always resolve the flagged row at request time (service role). */
export const dynamic = "force-dynamic";

/**
 * Unauthenticated sample evaluation page.
 * Resolves the single is_public_sample row server-side. No evaluation id in the URL.
 */
export default async function PublicSampleEvaluationPage() {
  const sample = await getPublicSampleEvaluation();

  if (!sample) {
    notFound();
  }

  const scriptureReference =
    sample.primaryPassage?.trim() ||
    sample.result.meta.scripture_reference.trim() ||
    null;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: "var(--sc-bg)" }}
    >
      <div className="mx-auto w-full max-w-[1100px] px-6 py-10 md:py-12">
        <header className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-block text-[20px] font-semibold no-underline"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            The Sermon <span style={{ color: "var(--sc-accent)" }}>Coach</span>
            &trade;
          </Link>

          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            Sample evaluation
          </p>
          <p
            className="max-w-[54ch] text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            A real evaluation of a real sermon, on Hebrews 3:1-6. Eleven criteria, each one traced to a named source. The band, the scores, and every criterion read below come straight from a stored Sermon Coach report.
          </p>
          <div className="mt-5">
            <Link
              href="/start"
              className="inline-block rounded border px-5 py-3 text-[14px] font-semibold tracking-wide no-underline"
              style={{
                ...uiFont,
                background: "var(--sc-ink)",
                borderColor: "var(--sc-ink)",
                color: "var(--sc-bg)",
              }}
            >
              Get your first evaluation free
            </Link>
          </div>
        </header>

        <main
          className="rounded px-6 py-10 md:px-8"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <EvaluationDashboard
            result={sample.result}
            sermonTitle={sample.sermonTitle}
            scriptureReference={scriptureReference}
            howItPreaches={sample.howItPreaches}
            showPrintActions={false}
            headlineTitle={sample.sermonTitle}
          />
        </main>

        <div className="mt-10 text-center">
          <Link
            href="/start"
            className="inline-block rounded border px-5 py-3 text-[14px] font-semibold tracking-wide no-underline"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              borderColor: "var(--sc-ink)",
              color: "var(--sc-bg)",
            }}
          >
            Get your first evaluation free
          </Link>
        </div>
      </div>
    </div>
  );
}
