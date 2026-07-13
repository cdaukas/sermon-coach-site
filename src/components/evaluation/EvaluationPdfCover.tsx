const serifFont = { fontFamily: "var(--font-serif)" };

const COVER_INTRO =
  "Our shelves are full of commentaries on the text, but there's never been one on the sermon itself.";

const COVER_COPY_THEIRS = [
  "Now there is. I ran one of yours through it. It was very encouraging!",
  "This is what The Sermon Coach returned within minutes on your sermon. It shows where it was strong, where it could grow, how it preaches, and the changes that would most strengthen it before you step into the pulpit. It assesses against the strongest principles in expositional preaching, drawn from the public work of some of the most respected pastors and authors we have.",
  "Personally, I use it on every sermon before I finalize my draft. It finds the soft spots in my sermon before the church is forced to sit through them.",
] as const;

const COVER_COPY_MINE = [
  "I don't have one of your sermons yet, so let me show you one of mine.",
  "This is what The Sermon Coach returned within minutes on a sermon I preached. It shows where it was strong, where it could grow, how it preaches, and the changes that would most strengthen it before I stepped into the pulpit. It assesses against the strongest principles in expositional preaching, drawn from the public work of some of the most respected pastors and authors we have.",
  "Personally, I use it on every sermon before I finalize my draft. It finds the soft spots in my sermon before the church is forced to sit through them.",
] as const;

export type EvaluationPdfCoverVariant = "theirs" | "mine";

type EvaluationPdfCoverProps = {
  preparedFor: string;
  variant: EvaluationPdfCoverVariant;
  sermonTitle: string;
  scriptureReference: string | null;
  preacherName: string | null;
  seriesName: string | null;
  submissionMode: string;
};

function formatSubmissionMode(mode: string): string {
  const trimmed = mode.trim();
  if (!trimmed) {
    return "—";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function CoverBottomLine() {
  return (
    <p style={{ ...serifFont, color: "var(--sc-ink)" }}>
      <strong>BOTTOM LINE:</strong> It can&apos;t make preaching easy....but it can make{" "}
      <em>effective</em> preaching easier.
    </p>
  );
}

export function EvaluationPdfCover({
  preparedFor,
  variant,
  sermonTitle,
  scriptureReference,
  preacherName,
  seriesName,
  submissionMode,
}: EvaluationPdfCoverProps) {
  const copy = variant === "mine" ? COVER_COPY_MINE : COVER_COPY_THEIRS;
  const preacher = preacherName?.trim() ?? "";

  return (
    <section className="evaluation-pdf-cover" aria-label="Cover page">
      <header className="evaluation-pdf-cover-band">
        <p className="evaluation-pdf-cover-wordmark">The Sermon Coach™</p>
        <div className="evaluation-pdf-cover-band-rule" aria-hidden="true" />
      </header>

      <div className="evaluation-pdf-cover-body">
        <p className="evaluation-pdf-cover-eyebrow">Sermon evaluation</p>
        <h1 className="evaluation-pdf-cover-title">{sermonTitle}</h1>
        {scriptureReference ? (
          <p className="evaluation-pdf-cover-passage">{scriptureReference}</p>
        ) : null}

        <dl className="evaluation-pdf-cover-facts">
          {preacher ? (
            <div>
              <dt>Preacher</dt>
              <dd>{preacher}</dd>
            </div>
          ) : null}
          <div>
            <dt>Passage</dt>
            <dd>{displayValue(scriptureReference)}</dd>
          </div>
          <div>
            <dt>Series</dt>
            <dd>{displayValue(seriesName)}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{formatSubmissionMode(submissionMode)}</dd>
          </div>
        </dl>

        <p className="evaluation-pdf-cover-prepared">
          Prepared for <span>{preparedFor}</span>
        </p>

        <div className="evaluation-pdf-cover-copy">
          <p style={{ ...serifFont, color: "var(--sc-ink)" }}>{COVER_INTRO}</p>
          {copy.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} style={{ ...serifFont, color: "var(--sc-ink)" }}>
              {paragraph}
            </p>
          ))}
          <CoverBottomLine />
        </div>

        <div className="evaluation-pdf-cover-spacer" aria-hidden="true" />

        <aside className="evaluation-pdf-cover-cta">
          <p className="evaluation-pdf-cover-cta-lead">Run yours (free)</p>
          <p className="evaluation-pdf-cover-cta-url">sermoncoach.com</p>
        </aside>
      </div>
    </section>
  );
}
