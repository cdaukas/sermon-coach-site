import type { EvaluationResult } from "@/lib/evaluation/schema";
import { CategoryCard } from "./CategoryCard";
import { FcfSection } from "./FcfSection";
import { GrowthOpportunitiesSection } from "./GrowthOpportunitiesSection";
import { HeadlineLockup } from "./HeadlineLockup";
import { HeatMapSection } from "./HeatMapSection";
import { MethodologySection } from "./MethodologySection";
import { PrioritiesSection } from "./PrioritiesSection";
import { RewritesSection } from "./RewritesSection";
import { formatLengthMinutes, serifFont, uiFont } from "./shared";
import { WorkingSection } from "./WorkingSection";

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

      {result.heat_map ? <HeatMapSection heatMap={result.heat_map} /> : null}

      {result.whats_working && result.whats_working.length > 0 ? (
        <WorkingSection whatsWorking={result.whats_working} />
      ) : null}

      {result.growth_opportunities_detailed &&
      result.growth_opportunities_detailed.length > 0 ? (
        <GrowthOpportunitiesSection
          growthOpportunities={result.growth_opportunities_detailed}
        />
      ) : null}

      {result.top_priorities && result.top_priorities.length > 0 ? (
        <PrioritiesSection topPriorities={result.top_priorities} />
      ) : null}

      {result.rewrites && result.rewrites.length > 0 ? (
        <RewritesSection rewrites={result.rewrites} />
      ) : null}

      {result.fcf ? <FcfSection fcf={result.fcf} /> : null}

      {result.methodology_note ? (
        <MethodologySection
          scoring={result.scoring}
          categories={result.categories}
          methodologyNote={result.methodology_note}
        />
      ) : null}
    </article>
  );
}
