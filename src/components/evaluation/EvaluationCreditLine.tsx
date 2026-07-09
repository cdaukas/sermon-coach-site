import { formatEvaluationCreditLine } from "@/lib/evaluation/credit-line";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationCreditLineProps = {
  entitlement: EvaluationEntitlement | null;
  className?: string;
};

export function EvaluationCreditLine({
  entitlement,
  className = "mt-2 text-[12px] leading-relaxed",
}: EvaluationCreditLineProps) {
  const line = formatEvaluationCreditLine(entitlement);

  if (!line) {
    return null;
  }

  return (
    <p className={className} style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
      {line}
    </p>
  );
}
