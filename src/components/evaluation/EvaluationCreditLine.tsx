import { formatEvaluationCreditLine } from "@/lib/evaluation/credit-line";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import type { OutputLanguage } from "@/lib/evaluation/output-language";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationCreditLineProps = {
  entitlement: EvaluationEntitlement | null;
  className?: string;
  outputLanguage?: OutputLanguage;
};

export function EvaluationCreditLine({
  entitlement,
  className = "mt-2 text-[12px] leading-relaxed",
  outputLanguage = "en",
}: EvaluationCreditLineProps) {
  const line = formatEvaluationCreditLine(entitlement, outputLanguage);

  if (!line) {
    return null;
  }

  return (
    <p className={className} style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
      {line}
    </p>
  );
}
