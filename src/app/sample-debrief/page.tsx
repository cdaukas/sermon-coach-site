import type { Metadata } from "next";
import Link from "next/link";
import { CoachingReportView } from "@/components/evaluation/CoachingReportView";
import { HowItPreachesSection } from "@/components/evaluation/HowItPreachesSection";
import { getPublicSampleDebrief } from "@/lib/evaluation/public-sample-debrief";
import type { PublicSampleDebrief } from "@/lib/evaluation/public-sample-debrief";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export const metadata: Metadata = {
  title: "Sample Debrief",
  description:
    "The same sermon on an Apprentice seat, read two ways: coaching for the preacher, the scored evaluation for the mentor.",
  alternates: { canonical: "/sample-debrief" },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * The pair is selected by fixed id and changes only when those rows are edited
 * by hand, so the rendered page is effectively static. Prerender it and refresh
 * hourly rather than paying a service-role round trip on every visit.
 */
export const revalidate = 3600;

type SampleLoad =
  | { ok: true; sample: PublicSampleDebrief }
  | { ok: false; reason: string };

/**
 * Never let a failed load become a 404.
 *
 * This loader has seven distinct null paths (either row missing, either row
 * the wrong status or report_mode, either schema failing to parse, either
 * follow-up lookup failing) plus a throw when Supabase env vars are absent,
 * so it is the most likely of the three sample pages to come back empty.
 * Prerendered, notFound() would bake a 404 and serve it for the whole
 * revalidate window. The shell renders instead: both panels keep their
 * headings, the closing copy and the link to the full evaluation stay, and
 * the real thing returns at the next revalidation.
 */
async function loadPublicSample(): Promise<SampleLoad> {
  try {
    const sample = await getPublicSampleDebrief();
    if (!sample) {
      return {
        ok: false,
        reason:
          "a row was missing, had the wrong status or report_mode, or failed schema parse",
      };
    }
    return { ok: true, sample };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

const unavailableStyle = {
  fontFamily: "var(--font-ui)",
  color: "var(--sc-ink-soft)",
} as const;

/**
 * Unauthenticated sample debrief page.
 * Loads a hard-coded mentored diagnostic + debrief pair. No evaluation id in the URL.
 */
export default async function PublicSampleDebriefPage() {
  const loaded = await loadPublicSample();

  if (!loaded.ok) {
    // Distinct marker: a build that quietly degrades should be greppable in the
    // build log and in the function log, not invisible.
    console.error(
      "[sample-debrief] FALLBACK RENDERED: serving the page shell instead of the mentored pair.",
      { reason: loaded.reason },
    );
  }

  const sample = loaded.ok ? loaded.sample : null;

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
            Sample
          </p>
          <h1
            className="mb-3 text-[28px] font-normal leading-tight tracking-tight md:text-[34px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            The same sermon, read two ways.
          </h1>
          <p
            className="max-w-[54ch] text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            This is one sermon on Hebrews 3:1-6, submitted by a preacher on an
            Apprentice seat. He opens coaching and How It Preaches. You open the
            scored evaluation, including a number he has not seen. You decide
            when he sees it.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <section
            className="rounded px-5 py-8 md:px-6"
            style={{
              background: "var(--sc-panel)",
              border: "1px solid var(--sc-rule)",
              boxShadow: "var(--sc-shadow-lift)",
            }}
          >
            <p
              className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              What he reads
            </p>
            {sample === null ? (
              <p className="text-[15px] leading-relaxed" style={unavailableStyle}>
                This sample is temporarily unavailable. Nothing is wrong with
                your link.
              </p>
            ) : (
              <>
                <CoachingReportView
                  data={sample.coaching}
                  showPrintActions={false}
                />
                <HowItPreachesSection howItPreaches={sample.howItPreaches} />
              </>
            )}
          </section>

          <section
            className="rounded px-5 py-8 md:px-6"
            style={{
              background: "var(--sc-panel)",
              border: "1px solid var(--sc-rule)",
              boxShadow: "var(--sc-shadow-lift)",
            }}
          >
            <p
              className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              What you read
            </p>
            {sample === null ? (
              <p className="text-[15px] leading-relaxed" style={unavailableStyle}>
                This sample is temporarily unavailable. Nothing is wrong with
                your link.
              </p>
            ) : (
              <>
                <p
                  className="text-[48px] font-semibold leading-none tracking-tight md:text-[56px]"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  {sample.mentorScore.displayScore}
                </p>
                <p
                  className="mt-3 text-[15px] leading-relaxed"
                  style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                >
                  {sample.mentorScore.bandLabel}
                  <span aria-hidden="true"> · </span>
                  {sample.mentorScore.weighted55} of 55
                </p>
              </>
            )}
          </section>
        </div>

        <p
          className="mx-auto mt-8 max-w-[58ch] text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          He gets the whole of the coaching and How It Preaches. What he does
          not get is a number to argue with before you have talked. When you
          are ready, you release the scored evaluation and he can open it too.
        </p>

        <p
          className="mt-10 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          This is a different sermon on the same passage. A full evaluation of
          another Hebrews 3:1-6 sermon is{" "}
          <Link
            href="/sample-evaluation"
            className="font-medium underline underline-offset-2"
            style={{ color: "var(--sc-accent)" }}
          >
            here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
