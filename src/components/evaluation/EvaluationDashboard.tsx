import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { CategoryCard } from "./CategoryCard";
import { HeadlineLockup } from "./HeadlineLockup";
import { HeatMapSection } from "./HeatMapSection";
import { MethodologySection } from "./MethodologySection";
import { PrioritiesSection } from "./PrioritiesSection";
import { RewritesSection } from "./RewritesSection";
import { formatLengthMinutes, serifFont, uiFont } from "./shared";
import { WorkingSection } from "./WorkingSection";

type EvaluationDashboardProps = {
  result: EvaluationResultStrict;
  sermonTitle: string;
};

export function EvaluationDashboard({
  result,
  sermonTitle,
}: EvaluationDashboardProps) {
  const { meta } = result;
  const showHeatMap = meta.audio_available && result.heat_map !== null;

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
        {meta.sermon_title}
      </h1>
      <p className="mb-6 text-lg italic" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
        {meta.scripture_reference}
      </p>

      <div
        className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-y py-3 text-[12px]"
        style={{ ...uiFont, borderColor: "var(--sc-rule)", color: "var(--sc-ink-soft)" }}
      >
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Sermon:</strong> {sermonTitle}
        </span>
        {meta.preacher_name ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>Preacher:</strong> {meta.preacher_name}
          </span>
        ) : null}
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Length:</strong>{" "}
          {formatLengthMinutes(meta.estimated_length_minutes)}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Mode:</strong> {meta.submission_mode}
        </span>
        {meta.church_or_context ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>Context:</strong> {meta.church_or_context}
          </span>
        ) : null}
        {meta.series_name ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>Series:</strong> {meta.series_name}
          </span>
        ) : null}
      </div>

      <HeadlineLockup scoring={result.scoring} verdict={result.verdict} />

      {result.categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}

      {showHeatMap && result.heat_map ? (
        <HeatMapSection
          heatMap={result.heat_map}
          fallbackTotalMinutes={meta.estimated_length_minutes}
        />
      ) : null}

      <WorkingSection whatsWorking={result.whats_working} />

      <PrioritiesSection topPriorities={result.top_priorities} />

      <RewritesSection rewrites={result.rewrites} />

      <MethodologySection scoring={result.scoring} categories={result.categories} />
    </article>
  );
}
