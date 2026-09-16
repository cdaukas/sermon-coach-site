import type { HowItPreaches } from "@/lib/evaluation/hip-schema";
import type { OutputLanguage } from "@/lib/evaluation/output-language";
import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { HowItPreachesSection } from "./HowItPreachesSection";
import { WorkingSection } from "./WorkingSection";

/**
 * Sibling assembler to EvaluationDashboard for the `doc=commendation` export.
 *
 * The render list here is an allowlist, not a suppress list: a commendation is
 * the affirmation, Where It's Strong, How It Preaches, and the closing block.
 * No component that carries a score, a rubric row, or growth material may be
 * imported. A section added to the evaluation report later does not arrive
 * here unless someone adds it deliberately.
 *
 * The affirmation is rendered inline rather than reused from the headline
 * lockup, which fuses the score panel and both verdict halves into one grid.
 */
type CommendationDocumentProps = {
  preacherName: string;
  churchName: string | null;
  sermonTitle: string;
  scriptureReference: string | null;
  affirmation: string;
  whatsWorking: EvaluationResultStrict["whats_working"];
  howItPreaches: HowItPreaches | null;
  outputLanguage?: OutputLanguage;
};

const CLOSING_LEAD =
  "This is the affirming half of a full evaluation. The half that names what to work on is not here, because you did not ask a stranger to critique your preaching.";
const CLOSING_OFFER =
  "If you want it, the full read is yours free at sermoncoach.online/start.";

const FOOTER_LINES = [
  "The Sermon Coach™ · Built by Dr. Christopher M. Daukas · Phoenix, Arizona",
  "Daukas Group, LLC · 9572 W Frank Ave, Peoria, AZ 85382",
  "The Sermon Coach is not affiliated with or endorsed by any of the authors or organizations named in this report.",
] as const;

export function CommendationDocument({
  preacherName,
  churchName,
  sermonTitle,
  scriptureReference,
  affirmation,
  whatsWorking,
  howItPreaches,
  outputLanguage = "en",
}: CommendationDocumentProps) {
  const church = churchName?.trim() || null;

  return (
    <article className="evaluation-report evaluation-commendation">
      <section
        className="evaluation-pdf-cover evaluation-commendation-cover"
        aria-label="Cover page"
      >
        <header className="evaluation-pdf-cover-band">
          <p className="evaluation-pdf-cover-wordmark">The Sermon Coach™</p>
          <div className="evaluation-pdf-cover-band-rule" aria-hidden="true" />
        </header>

        <div className="evaluation-pdf-cover-body">
          <h1 className="evaluation-commendation-cover-title">
            A commendation for {preacherName}
          </h1>
          {church ? (
            <p className="evaluation-commendation-cover-church">{church}</p>
          ) : null}

          <div className="evaluation-commendation-cover-sermon">
            <p className="evaluation-commendation-cover-sermon-title">
              {sermonTitle}
            </p>
            {scriptureReference ? (
              <p className="evaluation-commendation-cover-passage">
                {scriptureReference}
              </p>
            ) : null}
          </div>

          <div className="evaluation-pdf-cover-spacer" aria-hidden="true" />

          <div className="evaluation-commendation-cover-prepared">
            <p>Prepared by Dr. Christopher M. Daukas</p>
            <p>The Sermon Coach</p>
          </div>
        </div>
      </section>

      <p className="evaluation-commendation-affirmation">{affirmation}</p>

      <WorkingSection
        whatsWorking={whatsWorking}
        outputLanguage={outputLanguage}
      />

      {howItPreaches ? (
        <HowItPreachesSection
          howItPreaches={howItPreaches}
          outputLanguage={outputLanguage}
        />
      ) : null}

      <section className="evaluation-commendation-closing">
        <p>{CLOSING_LEAD}</p>
        <p>{CLOSING_OFFER}</p>
      </section>

      <footer className="evaluation-commendation-footer">
        {FOOTER_LINES.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </footer>
    </article>
  );
}
