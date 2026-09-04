import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  displayScoreBand,
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import { serifFont, splitVerdictImprovement, uiFont } from "./shared";

type HeadlineLockupProps = {
  scoring: EvaluationResultStrict["scoring"];
  verdict: EvaluationResultStrict["verdict"];
  outputLanguage?: OutputLanguage;
  /**
   * "See methodology for score" points at the Methodology block. When that
   * block is hidden the note would point at nothing, so it hides with it.
   */
  showMethodologyNote?: boolean;
};

export function HeadlineLockup({
  scoring,
  verdict,
  outputLanguage = "en",
  showMethodologyNote = true,
}: HeadlineLockupProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const { opener, body } = splitVerdictImprovement(
    verdict.improvement,
    copy.verdictImprovementFallback,
  );

  return (
    <section
      className="evaluation-headline-lockup mb-10 grid min-h-[280px] grid-cols-1 md:grid-cols-[280px_1fr]"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <div
        className="evaluation-score-panel flex flex-col items-center justify-center px-8 py-10 text-center"
        style={{
          background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
          color: "#faf8f3",
        }}
      >
        <p
          className="evaluation-score-panel-band mb-3 text-[52px] leading-none italic"
          style={{ ...serifFont, color: "var(--sc-accent-soft)" }}
        >
          {displayScoreBand(scoring.band, outputLanguage)}
        </p>
        <p className="evaluation-score-panel-label">{copy.summary}</p>
        {showMethodologyNote ? (
          <p
            className="evaluation-score-method-note text-[10px] tracking-[0.1em] uppercase"
            style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
          >
            {copy.seeMethodology}
          </p>
        ) : null}
      </div>
      <div
        className="evaluation-verdict-panel flex flex-col justify-center border-l-[3px] px-8 py-9"
        style={{ borderColor: "var(--sc-accent)" }}
      >
        <p className="mb-4 text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          {verdict.affirmation}
        </p>
        <p className="text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
          <strong style={{ color: "var(--sc-ink)", fontWeight: 600 }}>{opener}</strong> {body}
        </p>
      </div>
    </section>
  );
}
