import { evaluationReportCopy, type OutputLanguage } from "./output-language";
import type { EvaluationEntitlement } from "./entitlement-types";

export function formatEvaluationCreditLine(
  entitlement: EvaluationEntitlement | null,
  language: OutputLanguage = "en",
): string | null {
  if (!entitlement?.canEvaluate) {
    return null;
  }

  const copy = evaluationReportCopy(language);
  if (entitlement.creditSource === "free") {
    return copy.firstEvaluationFree;
  }

  return copy.usesOneCredit;
}
