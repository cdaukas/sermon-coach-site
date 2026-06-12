import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  CATEGORY_MAX_POINTS,
  categoryAverage,
  categorySubtotal,
} from "@/lib/evaluation/schema";
import {
  criterionScoreColor,
  criterionScoreFillPercent,
  serifFont,
  uiFont,
} from "./shared";

type CategoryCardProps = {
  category: EvaluationResultStrict["categories"][number];
};

function CriterionScoreBar({ score }: { score: number }) {
  const color = criterionScoreColor(score);
  const fillPercent = criterionScoreFillPercent(score);

  return (
    <div
      className="relative hidden h-2.5 rounded-full md:block"
      style={{ background: "var(--sc-rule)" }}
      aria-hidden
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${fillPercent}%`, background: color }}
      />
      <div
        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--sc-panel)]"
        style={{ left: `${fillPercent}%`, borderColor: color }}
      />
    </div>
  );
}

export function CategoryCard({ category }: CategoryCardProps) {
  const subtotal = categorySubtotal(category.criteria);
  const max = CATEGORY_MAX_POINTS[category.number] ?? subtotal;
  const average = categoryAverage(category.criteria);
  const averageLabel = `Average ${average} / 5 · ${subtotal}/${max}`;

  return (
    <section
      className="evaluation-category-card mb-7"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-4 px-8 py-5"
        style={{
          background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
          color: "#faf8f3",
        }}
      >
        <h2 className="text-2xl font-normal" style={serifFont}>
          <span style={{ color: "var(--sc-accent-soft)" }}>{category.number} ·</span>{" "}
          {category.name}
        </h2>
        <p
          className="text-[11px] tracking-[0.08em] uppercase"
          style={{ ...uiFont, color: "rgba(250,248,243,0.7)" }}
        >
          {averageLabel}
        </p>
      </header>

      <div className="py-2">
        {category.criteria.map((criterion) => (
          <details
            key={`${criterion.id}-${criterion.name}`}
            className="evaluation-criterion group border-b last:border-b-0"
            style={{ borderColor: "var(--sc-rule)" }}
          >
            <summary
              className="grid cursor-pointer list-none grid-cols-[24px_1fr_auto] items-center gap-3 px-8 py-4 transition-colors hover:bg-[var(--sc-accent-pale)] md:grid-cols-[24px_1fr_220px_56px] md:gap-4 [&::-webkit-details-marker]:hidden"
            >
              <span
                className="text-sm leading-none transition-transform group-open:rotate-90"
                style={{ color: "var(--sc-accent)" }}
                aria-hidden
              >
                ▸
              </span>
              <p className="text-base font-medium" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                {criterion.name}
                <span
                  className="text-[11px] font-normal tracking-normal"
                  style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                >
                  {" · "}
                  <em style={{ fontStyle: "italic" }}>{criterion.tradition_tag}</em>
                </span>
              </p>
              <CriterionScoreBar score={criterion.score} />
              <p
                className="text-right text-sm font-semibold md:col-start-4"
                style={{ ...uiFont, color: "var(--sc-ink)" }}
              >
                {criterion.score}/5
              </p>
            </summary>
            <div
              className="border-t px-8 pb-6 pt-2"
              style={{
                borderColor: "var(--sc-rule)",
                background: "var(--sc-accent-pale)",
              }}
            >
              <p
                className="mb-3 text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {criterion.narrative}
              </p>
              {criterion.anchored_quote ? (
                <blockquote
                  className="mt-4 border-l-2 pl-4 text-[15px] italic leading-relaxed"
                  style={{
                    ...serifFont,
                    borderColor: "var(--sc-accent)",
                    color: "var(--sc-ink-mid)",
                  }}
                >
                  {criterion.anchored_quote.text}
                  <footer
                    className="mt-2 text-[11px] not-italic uppercase tracking-[0.06em]"
                    style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                  >
                    {criterion.anchored_quote.approximate_location}
                  </footer>
                </blockquote>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
