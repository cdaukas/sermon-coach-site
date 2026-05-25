import type { EvaluationResult } from "@/lib/evaluation/schema";
import { CategoryCard } from "./CategoryCard";
import { HeadlineLockup } from "./HeadlineLockup";

const serifFont = { fontFamily: "var(--font-serif)" };
const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationDashboardProps = {
  result: EvaluationResult;
  sermonTitle: string;
};

export function EvaluationDashboard({
  result,
  sermonTitle,
}: EvaluationDashboardProps) {
  const { meta } = result;

  return (
    <article>
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Evaluation
      </p>
      <h1
        className="mb-2 text-[36px] font-normal leading-tight tracking-tight md:text-[44px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {meta.title}
      </h1>
      <p className="mb-6 text-lg italic" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
        {meta.passage}
      </p>

      <div
        className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-y py-3 text-[12px]"
        style={{ ...uiFont, borderColor: "var(--sc-rule)", color: "var(--sc-ink-soft)" }}
      >
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Sermon:</strong> {sermonTitle}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Preacher:</strong> {meta.preacher}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Length:</strong> {meta.length}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Mode:</strong> {meta.mode}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Source:</strong> {meta.source}
        </span>
      </div>

      <HeadlineLockup headline={result.headline} />

      {result.categories.map((category) => (
        <CategoryCard key={category.number} category={category} />
      ))}
    </article>
  );
}
