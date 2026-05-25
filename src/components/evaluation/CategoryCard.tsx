import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  CATEGORY_MAX_POINTS,
  categoryAverage,
  categorySubtotal,
} from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

type CategoryCardProps = {
  category: EvaluationResultStrict["categories"][number];
};

export function CategoryCard({ category }: CategoryCardProps) {
  const subtotal = categorySubtotal(category.criteria);
  const max = CATEGORY_MAX_POINTS[category.number] ?? subtotal;
  const average = categoryAverage(category.criteria);
  const averageLabel = `Avg ${average} / 5 · ${subtotal}/${max}`;

  return (
    <section
      className="mb-7"
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
          <span style={{ color: "var(--sc-accent-soft)" }}>{category.number}.</span>{" "}
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
        {category.criteria.map((criterion) => {
          const preview = criterion.narrative;
          return (
            <details
              key={`${criterion.id}-${criterion.name}`}
              className="group border-b last:border-b-0"
              style={{ borderColor: "var(--sc-rule)" }}
            >
              <summary
                className="grid cursor-pointer list-none grid-cols-1 gap-2 px-8 py-4 transition-colors hover:bg-[var(--sc-accent-pale)] md:grid-cols-[1fr_auto_48px] md:items-center md:gap-6 [&::-webkit-details-marker]:hidden"
              >
                <div>
                  <p className="text-lg" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                    {criterion.name}
                    {criterion.is_double_weighted ? (
                      <span
                        className="ml-2 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...uiFont, color: "var(--sc-accent)" }}
                      >
                        ×2
                      </span>
                    ) : null}
                  </p>
                  <p
                    className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{ ...uiFont, color: "var(--sc-accent)" }}
                  >
                    {criterion.tradition_tag}
                  </p>
                </div>
                <p
                  className="hidden text-[13px] md:block"
                  style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
                >
                  {preview.slice(0, 120)}
                  {preview.length > 120 ? "…" : ""}
                </p>
                <p
                  className="text-right text-2xl font-normal"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  {criterion.score}
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
          );
        })}
      </div>
    </section>
  );
}
