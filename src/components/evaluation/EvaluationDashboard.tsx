import type { HowItPreaches } from "@/lib/evaluation/hip-schema";
import {
  displaySubmissionMode,
  evaluationReportCopy,
  type Criterion2Wording,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import Link from "next/link";
import { CategoryCard } from "./CategoryCard";
import { HeadlineLockup } from "./HeadlineLockup";
import { HeatMapSection } from "./HeatMapSection";
import { HowItPreachesSection } from "./HowItPreachesSection";
import { MelodicLineSection } from "./MelodicLineSection";
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
  outputLanguage?: OutputLanguage;
  criterion2Wording?: Criterion2Wording;
  criterion2SwitcherHrefs?: Record<Criterion2Wording, string>;
  /**
   * Per-account visibility of the Methodology block (profiles
   * .include_methodology_in_reports), read live at render time. Presentation
   * only — the scored payload is identical either way. Defaults to true so
   * the public sample and the stub smoke test keep the block.
   */
  showMethodology?: boolean;
};

export function EvaluationDashboard({
  result,
  sermonTitle,
  scriptureReference,
  showPrintActions = true,
  howItPreaches = null,
  headlineTitle = null,
  outputLanguage = "en",
  criterion2Wording = "default",
  criterion2SwitcherHrefs,
  showMethodology = true,
}: EvaluationDashboardProps) {
  const { meta } = result;
  const copy = evaluationReportCopy(outputLanguage);
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
        {copy.eyebrow}
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
          <strong style={{ color: "var(--sc-ink)" }}>{copy.sermon}:</strong> {sermonTitle}
        </span>
        {meta.preacher_name ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>{copy.preacher}:</strong> {meta.preacher_name}
          </span>
        ) : null}
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>{copy.mode}:</strong>{" "}
          {displaySubmissionMode(meta.submission_mode, outputLanguage)}
        </span>
        {meta.church_or_context ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>{copy.context}:</strong> {meta.church_or_context}
          </span>
        ) : null}
        {meta.series_name ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>{copy.series}:</strong> {meta.series_name}
          </span>
        ) : null}
      </div>

      {showPrintActions ? (
        <div className="screen-only -mt-6 mb-10 flex justify-end gap-2">
          <EvaluationPrintButtons outputLanguage={outputLanguage} />
        </div>
      ) : null}

      <HeadlineLockup
        scoring={result.scoring}
        verdict={result.verdict}
        outputLanguage={outputLanguage}
        showMethodologyNote={showMethodology}
      />

      {result.melodic_line_and_big_idea ? (
        <MelodicLineSection
          block={result.melodic_line_and_big_idea}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {criterion2SwitcherHrefs ? (
        <nav
          className="evaluation-c2-switcher screen-only mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"
          aria-label={copy.criterion2Switcher}
        >
          <span
            className="text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {copy.criterion2Switcher}
          </span>
          {(
            [
              ["default", "centrado en Cristo"],
              ["cristocentrico", "cristocéntrico"],
            ] as const
          ).map(([id, label]) => {
            const active = id === criterion2Wording;
            return (
              <Link
                key={id}
                href={criterion2SwitcherHrefs[id]}
                className="text-[12px] no-underline"
                style={{
                  ...uiFont,
                  color: active ? "var(--sc-ink)" : "var(--sc-ink-soft)",
                  fontWeight: active ? 600 : 400,
                  textDecoration: active ? "underline" : "none",
                  textUnderlineOffset: "0.18em",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {result.categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          outputLanguage={outputLanguage}
          criterion2Wording={criterion2Wording}
        />
      ))}

      {showHeatMap && result.heat_map ? (
        <HeatMapSection
          heatMap={result.heat_map}
          fallbackTotalMinutes={meta.estimated_length_minutes}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {howItPreaches ? (
        <HowItPreachesSection
          howItPreaches={howItPreaches}
          outputLanguage={outputLanguage}
        />
      ) : null}

      <WorkingSection
        whatsWorking={result.whats_working}
        outputLanguage={outputLanguage}
      />

      <PrioritiesSection
        topPriorities={result.top_priorities}
        outputLanguage={outputLanguage}
      />

      <RewritesSection rewrites={result.rewrites} outputLanguage={outputLanguage} />

      {showMethodology ? (
        <MethodologySection
          scoring={result.scoring}
          categories={result.categories}
          outputLanguage={outputLanguage}
        />
      ) : null}
    </article>
  );
}
