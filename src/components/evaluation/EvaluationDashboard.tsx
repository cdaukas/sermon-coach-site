import type { HowItPreaches } from "@/lib/evaluation/hip-schema";
import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { CategoryCard } from "./CategoryCard";
import { HeadlineLockup } from "./HeadlineLockup";
import { HeatMapSection } from "./HeatMapSection";
import { HowItPreachesSection } from "./HowItPreachesSection";
import { MethodologySection } from "./MethodologySection";
import { PrioritiesSection } from "./PrioritiesSection";
import { RewritesSection } from "./RewritesSection";
import { EvaluationPrintButtons } from "@/components/evaluation/EvaluationPrintButtons";
import { serifFont, uiFont } from "./shared";
import { WorkingSection } from "./WorkingSection";

type EvaluationDashboardProps = {
  result: EvaluationResultStrict;
  sermonTitle: string;
  scriptureReference?: string | null;
  showPrintActions?: boolean;
  howItPreaches?: HowItPreaches | null;
  /**
   * Optional public-sample override for the report h1.
   * When absent or blank, the dashboard keeps using result.meta.sermon_title.
   */
  headlineTitle?: string | null;
};

export function EvaluationDashboard({
  result,
  sermonTitle,
  scriptureReference,
  showPrintActions = true,
  howItPreaches = null,
  headlineTitle = null,
}: EvaluationDashboardProps) {
  const { meta } = result;
  const showHeatMap = meta.audio_available && result.heat_map !== null;
  const displayScriptureReference =
    scriptureReference?.trim() || meta.scripture_reference;
  const displayHeadline =
    headlineTitle?.trim() || meta.sermon_title;

  return (
    <article className="evaluation-report">
      <p
        className="evaluation-report-eyebrow mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Evaluation
      </p>
      <h1
        className="evaluation-report-title mb-2 text-[36px] font-normal leading-tight tracking-tight md:text-[44px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {displayHeadline}
      </h1>
      <p
        className="evaluation-report-scripture mb-6 text-lg italic"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {displayScriptureReference}
      </p>

      <div
        className="evaluation-report-meta mb-10 flex flex-wrap gap-x-6 gap-y-2 border-y py-3 text-[12px]"
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

      {showPrintActions ? (
        <div className="screen-only -mt-6 mb-10 flex justify-end gap-2">
          <EvaluationPrintButtons />
        </div>
      ) : null}

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

      {howItPreaches ? <HowItPreachesSection howItPreaches={howItPreaches} /> : null}

      <WorkingSection whatsWorking={result.whats_working} />

      <PrioritiesSection topPriorities={result.top_priorities} />

      <RewritesSection rewrites={result.rewrites} />

      <MethodologySection scoring={result.scoring} categories={result.categories} />
    </article>
  );
}
