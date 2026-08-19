import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { categoryAverage } from "@/lib/evaluation/schema";
import {
  displayCategoryName,
  displayCriterionName,
  displayTraditionTag,
  evaluationReportCopy,
  type Criterion2Wording,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import {
  criterionScoreColor,
  criterionScoreFillPercent,
  serifFont,
  uiFont,
} from "./shared";

type CategoryCardProps = {
  category: EvaluationResultStrict["categories"][number];
  outputLanguage?: OutputLanguage;
  criterion2Wording?: Criterion2Wording;
};

const SCORE_BAR_VIEWBOX_WIDTH = 220;
const SCORE_BAR_HEIGHT = 10;

function CriterionScoreBar({ score }: { score: number }) {
  const color = criterionScoreColor(score);
  const fillPercent = criterionScoreFillPercent(score);
  const fillWidth = (SCORE_BAR_VIEWBOX_WIDTH * fillPercent) / 100;

  return (
    <div className="relative hidden h-2.5 md:block" aria-hidden>
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${SCORE_BAR_VIEWBOX_WIDTH} ${SCORE_BAR_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect
          width={SCORE_BAR_VIEWBOX_WIDTH}
          height={SCORE_BAR_HEIGHT}
          rx={SCORE_BAR_HEIGHT / 2}
          fill="var(--sc-rule)"
        />
        <rect
          width={fillWidth}
          height={SCORE_BAR_HEIGHT}
          rx={SCORE_BAR_HEIGHT / 2}
          fill={color}
        />
      </svg>
      <div
        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--sc-panel)]"
        style={{ left: `${fillPercent}%`, borderColor: color }}
      />
    </div>
  );
}

export function CategoryCard({
  category,
  outputLanguage = "en",
  criterion2Wording = "default",
}: CategoryCardProps) {
  const average = categoryAverage(category.criteria);
  const copy = evaluationReportCopy(outputLanguage);
  const averageLabel = copy.average(String(average));
  const categoryName = displayCategoryName(
    category.id,
    category.name,
    outputLanguage,
  );

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
          {categoryName}
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
                className="evaluation-disclosure-chevron text-sm leading-none transition-transform group-open:rotate-90"
                style={{ color: "var(--sc-accent)" }}
                aria-hidden
              >
                ▸
              </span>
              <div className="min-w-0 text-[12px]">
                {criterion.verdict_line ? (
                  <p
                    className="evaluation-criterion-verdict max-w-[58ch] text-[1.08em] leading-snug"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {criterion.verdict_line}
                  </p>
                ) : null}
                <p
                  className={`evaluation-criterion-name text-[1em] font-normal leading-snug ${
                    criterion.verdict_line ? "mt-1.5" : ""
                  }`}
                  style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
                >
                  {displayCriterionName(
                    criterion.id,
                    criterion.name,
                    outputLanguage,
                    criterion2Wording,
                  )}
                  <span
                    className="text-[11px] font-normal tracking-normal"
                    style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
                  >
                    {" · "}
                    <em style={{ fontStyle: "italic" }}>
                      {displayTraditionTag(
                        criterion.id,
                        criterion.tradition_tag,
                        outputLanguage,
                      )}
                    </em>
                  </span>
                </p>
              </div>
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
              {criterion.narrative
                .split(/\n\s*\n/)
                .map((part) => part.trim())
                .filter((part) => part.length > 0)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="mb-3 text-[15px] leading-relaxed"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {paragraph}
                  </p>
                ))}
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
