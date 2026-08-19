import {
  evaluationReportCopy,
  formatEvaluationDate,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";

type EvaluationPrintHeaderProps = {
  pastorName: string | null;
  sermonTitle: string;
  scriptureReference: string | null;
  evaluatedAt: string | null;
  outputLanguage?: OutputLanguage;
};

export function EvaluationPrintHeader({
  pastorName,
  sermonTitle,
  scriptureReference,
  evaluatedAt,
  outputLanguage = "en",
}: EvaluationPrintHeaderProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const evaluatedLabel = evaluatedAt
    ? formatEvaluationDate(evaluatedAt, outputLanguage, "long")
    : null;
  const titleLine = pastorName ? `${pastorName} · ${sermonTitle}` : sermonTitle;
  const evaluatedLine = evaluatedLabel
    ? `${copy.evaluatedPrefix} ${evaluatedLabel}`
    : null;
  const metaLine =
    scriptureReference && evaluatedLine
      ? `${scriptureReference} · ${evaluatedLine}`
      : scriptureReference
        ? scriptureReference
        : evaluatedLine;

  return (
    <header className="evaluation-print-header print-only" aria-hidden="true">
      <p
        className="evaluation-print-wordmark"
        style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
      >
        The Sermon <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
      </p>
      <p className="evaluation-print-title-line">{titleLine}</p>
      {metaLine ? <p className="evaluation-print-meta-line">{metaLine}</p> : null}
      <p className="evaluation-print-provenance">{copy.printProvenance}</p>
      <p className="evaluation-print-disclaimer">{copy.printDisclaimer}</p>
    </header>
  );
}
