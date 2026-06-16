import Link from "next/link";
import { formatDisplayScoreBare } from "@/lib/evaluation/display-score";
import {
  buildQuotePairsFromGrowthReport,
  type GrowthReportData,
  type QuotePair,
} from "@/lib/evaluation/growth-report";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type GrowthReportViewProps = {
  data: GrowthReportData;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function formatCriterionDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta}`;
}

function sermonLabel(title: string, completedAt: string): string {
  return `${title} · ${formatDate(completedAt)}`;
}

function QuoteBlock({ label, quote }: { label: string; quote: string }) {
  return (
    <figure className="m-0">
      <figcaption
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {label}
      </figcaption>
      <blockquote
        className="m-0 border-l-2 pl-4 text-[15px] italic leading-relaxed"
        style={{
          ...serifFont,
          borderColor: "var(--sc-accent)",
          color: "var(--sc-ink-mid)",
        }}
      >
        {quote}
      </blockquote>
    </figure>
  );
}

function QuotePairCard({
  pair,
  data,
}: {
  pair: QuotePair;
  data: GrowthReportData;
}) {
  const baselineLabel = sermonLabel(
    data.baseline.sermonTitle,
    data.baseline.completedAt,
  );
  const currentLabel = sermonLabel(
    data.current.sermonTitle,
    data.current.completedAt,
  );

  return (
    <article
      className="rounded border px-6 py-5"
      style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
    >
      <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3
          className="text-lg font-semibold"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {pair.criterionName}
        </h3>
        <p className="text-[13px] font-medium" style={{ ...uiFont, color: "var(--sc-ink)" }}>
          {formatCriterionDelta(pair.delta)} on this criterion
        </p>
        {pair.isDoubleWeighted ? (
          <span
            className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              ...uiFont,
              background: "var(--sc-accent-pale)",
              color: "var(--sc-accent)",
            }}
          >
            Double weight
          </span>
        ) : null}
      </header>

      {pair.pairState === "pair" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <QuoteBlock label={baselineLabel} quote={pair.baselineQuote!} />
          <QuoteBlock label={currentLabel} quote={pair.currentQuote!} />
        </div>
      ) : null}

      {pair.pairState === "baseline_only" ? (
        <div>
          <QuoteBlock label={baselineLabel} quote={pair.baselineQuote!} />
          <p
            className="mt-4 text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            The current sermon did not anchor a quote on this criterion.
          </p>
        </div>
      ) : null}

      {pair.pairState === "current_only" ? (
        <div>
          <QuoteBlock label={currentLabel} quote={pair.currentQuote!} />
          <p
            className="mt-4 text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            The baseline sermon did not anchor a quote on this criterion.
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function GrowthReportView({ data }: GrowthReportViewProps) {
  const quotePairs = buildQuotePairsFromGrowthReport(data);
  const baselineScore = formatDisplayScoreBare(
    data.baseline.result.scoring.composite_weighted,
  );
  const currentScore = formatDisplayScoreBare(
    data.current.result.scoring.composite_weighted,
  );
  const delta =
    data.current.result.scoring.composite_weighted -
    data.baseline.result.scoring.composite_weighted;

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

      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Growth report
      </p>
      <h1
        className="mb-8 text-[32px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        How your preaching is moving
      </h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <section
          className="rounded border px-6 py-5"
          style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
        >
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Baseline
          </p>
          <h2
            className="mb-1 text-xl font-semibold"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {data.baseline.sermonTitle}
          </h2>
          <p className="text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
            {formatDate(data.baseline.completedAt)} · {baselineScore} / 10 ·{" "}
            {data.baseline.result.scoring.band}
          </p>
        </section>

        <section
          className="rounded border px-6 py-5"
          style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
        >
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Current
          </p>
          <h2
            className="mb-1 text-xl font-semibold"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {data.current.sermonTitle}
          </h2>
          <p className="text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
            {formatDate(data.current.completedAt)} · {currentScore} / 10 ·{" "}
            {data.current.result.scoring.band}
          </p>
        </section>
      </div>

      <p className="text-[14px] leading-relaxed" style={{ ...uiFont, color: "var(--sc-ink)" }}>
        Composite change: {delta > 0 ? "+" : ""}
        {delta} weighted points ({baselineScore} → {currentScore} display).
      </p>

      {quotePairs.length > 0 ? (
        <section className="mt-10">
          <h2
            className="mb-2 text-[22px] font-semibold"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Where you moved
          </h2>
          <p
            className="mb-6 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Anchored quotes from the criteria that changed most — pulled from each
            sermon&apos;s original evaluation.
          </p>
          <div className="flex flex-col gap-5">
            {quotePairs.map((pair) => (
              <QuotePairCard key={pair.criterionId} pair={pair} data={data} />
            ))}
          </div>
        </section>
      ) : (
        <p
          className="mt-8 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          No quote pairs to show. Scores may be flat on quoted criteria, or moved
          criteria may not have anchored quotes on either sermon.
        </p>
      )}
    </main>
  );
}
