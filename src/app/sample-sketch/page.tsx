import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSampleSketchReport } from "@/components/sketch/PublicSampleSketchReport";
import { getPublicSampleSketch } from "@/lib/sketch/public-sample";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export const metadata: Metadata = {
  title: "Sample Sketch",
  description:
    "A full Sermon Coach Sketch read of a real outline, shown as a public sample.",
  robots: {
    index: true,
    follow: true,
  },
};

/** Always resolve the flagged row at request time (service role). */
export const dynamic = "force-dynamic";

/**
 * Unauthenticated sample Sketch page.
 * Resolves the single is_public_sample readiness_reads row server-side. No id in the URL.
 */
export default async function PublicSampleSketchPage() {
  const sample = await getPublicSampleSketch();

  if (!sample) {
    notFound();
  }

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
            Sample Sketch
          </p>
          <p
            className="max-w-[54ch] text-[15px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            A Sketch read of a real outline, on Hebrews 3:1-6, before the sermon was written. Six answers in, one read out. The Sketch checks whether what you already believe about the passage holds together. It is not independent exegesis, and the six answers it read are printed below so you can see exactly what it worked from.
          </p>
          <div className="mt-5">
            <Link
              href="/sketch"
              className="inline-block rounded border px-5 py-3 text-[14px] font-semibold tracking-wide no-underline"
              style={{
                ...uiFont,
                background: "var(--sc-ink)",
                borderColor: "var(--sc-ink)",
                color: "var(--sc-bg)",
              }}
            >
              Try the Sketch
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
          <PublicSampleSketchReport
            primaryPassage={sample.primaryPassage}
            answers={sample.answers}
            readOutput={sample.readOutput}
            status={sample.status}
          />
        </main>

        <div className="mt-10 text-center">
          <Link
            href="/sketch"
            className="inline-block rounded border px-5 py-3 text-[14px] font-semibold tracking-wide no-underline"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              borderColor: "var(--sc-ink)",
              color: "var(--sc-bg)",
            }}
          >
            Try the Sketch
          </Link>
        </div>
      </div>
    </div>
  );
}
