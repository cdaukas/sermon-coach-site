import {
  EVALUATION_LEGAL_DISCLAIMER,
  EVALUATION_PROVENANCE_LINE,
} from "@/lib/evaluation/legal-disclaimer";

type EvaluationPrintHeaderProps = {
  pastorName: string | null;
  sermonTitle: string;
  scriptureReference: string | null;
  evaluatedAt: string | null;
};

function formatEvaluatedDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
    new Date(iso),
  );
}

export function EvaluationPrintHeader({
  pastorName,
  sermonTitle,
  scriptureReference,
  evaluatedAt,
}: EvaluationPrintHeaderProps) {
  const evaluatedLabel = formatEvaluatedDate(evaluatedAt);
  const titleLine = pastorName ? `${pastorName} · ${sermonTitle}` : sermonTitle;
  const metaLine =
    scriptureReference && evaluatedLabel
      ? `${scriptureReference} · Evaluated ${evaluatedLabel}`
      : scriptureReference
        ? scriptureReference
        : evaluatedLabel
          ? `Evaluated ${evaluatedLabel}`
          : null;

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
      <p className="evaluation-print-provenance">{EVALUATION_PROVENANCE_LINE}</p>
      <p className="evaluation-print-disclaimer">{EVALUATION_LEGAL_DISCLAIMER}</p>
    </header>
  );
}
