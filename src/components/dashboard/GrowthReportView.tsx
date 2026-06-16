import Link from "next/link";
import type {
  GrowthReportCriterionDelta,
  GrowthReportHeadlines,
  GrowthReportPresentation,
  QuotePair,
} from "@/lib/evaluation/growth-report-types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type GrowthReportViewProps = {
  data: GrowthReportPresentation;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function formatCriterionDelta(delta: number): string {
  if (delta === 0) {
    return "Held";
  }

  return `${delta > 0 ? "+" : ""}${delta}`;
}

function sermonLabel(title: string, completedAt: string): string {
  return `${title} · ${formatDate(completedAt)}`;
}

function deltaTone(delta: number): "up" | "down" | "held" {
  if (delta > 0) {
    return "up";
  }

  if (delta < 0) {
    return "down";
  }

  return "held";
}

const deltaToneStyles = {
  up: {
    color: "var(--sc-green)",
    background: "color-mix(in srgb, var(--sc-green) 12%, var(--sc-bg))",
  },
  down: {
    color: "var(--sc-red)",
    background: "color-mix(in srgb, var(--sc-red) 10%, var(--sc-bg))",
  },
  held: {
    color: "var(--sc-ink-soft)",
    background: "var(--sc-bg)",
  },
} as const;

function OverallMovementPanel({
  headlines,
}: {
  headlines: GrowthReportHeadlines;
}) {
  const { composite_weighted_delta: delta } = headlines;
  const bandChanged = headlines.band_a !== headlines.band_b;

  return (
    <section
      className="mb-8 rounded border px-6 py-5"
      style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
    >
      <h2
        className="mb-4 text-[20px] font-semibold"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Overall movement
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className="rounded px-3 py-1.5 text-[13px] font-semibold"
          style={{ ...uiFont, background: "var(--sc-panel)", color: "var(--sc-ink)" }}
        >
          {headlines.band_a}
        </span>
        <span
          className="text-[18px] font-semibold"
          style={{ ...uiFont, color: bandChanged ? "var(--sc-accent)" : "var(--sc-ink-soft)" }}
          aria-hidden
        >
          →
        </span>
        <span
          className="rounded px-3 py-1.5 text-[13px] font-semibold"
          style={{
            ...uiFont,
            background: bandChanged ? "var(--sc-accent-pale)" : "var(--sc-panel)",
            color: "var(--sc-ink)",
          }}
        >
          {headlines.band_b}
        </span>
        <span
          className="text-[12px] font-medium uppercase tracking-[0.08em]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {bandChanged ? "Band change" : "Same band"}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed" style={{ ...uiFont, color: "var(--sc-ink)" }}>
        {delta > 0 ? "+" : ""}
        {delta} weighted points · {headlines.display_score_a} → {headlines.display_score_b}{" "}
        / 10 display
      </p>
    </section>
  );
}

function CriterionMovementRow({ row }: { row: GrowthReportCriterionDelta }) {
  const tone = deltaTone(row.delta);
  const toneStyle = deltaToneStyles[tone];

  return (
    <tr
      className="border-b last:border-b-0"
      style={{
        borderColor: "var(--sc-rule)",
        background: tone === "held" ? "transparent" : toneStyle.background,
      }}
    >
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-medium" style={{ ...serifFont, color: "var(--sc-ink)" }}>
            {row.name}
          </span>
          {row.is_double_weighted ? (
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
        </div>
      </td>
      <td
        className="px-4 py-3 text-right text-[14px] font-medium tabular-nums"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {row.score_a}/5
      </td>
      <td
        className="px-4 py-3 text-right text-[14px] font-medium tabular-nums"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {row.score_b}/5
      </td>
      <td
        className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
        style={{ ...uiFont, color: toneStyle.color }}
      >
        {formatCriterionDelta(row.delta)}
      </td>
    </tr>
  );
}

function CriterionMovementTable({ data }: { data: GrowthReportPresentation }) {
  const deltasByCategory = new Map<number, GrowthReportCriterionDelta[]>();

  for (const row of data.criterionDeltas) {
    const rows = deltasByCategory.get(row.category) ?? [];
    rows.push(row);
    deltasByCategory.set(row.category, rows);
  }

  return (
    <section className="mb-10">
      <h2
        className="mb-2 text-[22px] font-semibold"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Criterion movement
      </h2>
      <p
        className="mb-6 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        All eleven rubric criteria — baseline (A) to current (B). Green marks improvement,
        muted rows held steady.
      </p>

      <div className="flex flex-col gap-5">
        {data.categories.map((category) => {
          const rows = deltasByCategory.get(category.number) ?? [];

          return (
            <div
              key={category.id}
              className="overflow-hidden rounded border"
              style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
            >
              <header
                className="border-b px-4 py-3"
                style={{
                  borderColor: "var(--sc-rule)",
                  background: "var(--sc-panel)",
                }}
              >
                <h3
                  className="text-[15px] font-semibold"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  <span style={{ color: "var(--sc-accent)" }}>{category.number} ·</span>{" "}
                  {category.name}
                </h3>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr
                      className="border-b text-left"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      <th
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                      >
                        Criterion
                      </th>
                      <th
                        className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                      >
                        A
                      </th>
                      <th
                        className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                      >
                        B
                      </th>
                      <th
                        className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                      >
                        Δ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <CriterionMovementRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
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
  data: GrowthReportPresentation;
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
  const { headlines, quotePairs } = data;
  const baselineScore = headlines.display_score_a;
  const currentScore = headlines.display_score_b;

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
            {headlines.band_a}
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
            {headlines.band_b}
          </p>
        </section>
      </div>

      <OverallMovementPanel headlines={headlines} />

      <CriterionMovementTable data={data} />

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
