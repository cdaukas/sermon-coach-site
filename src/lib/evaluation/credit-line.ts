import type { EvaluationEntitlement } from "./entitlement-types";

export function formatEvaluationCreditLine(
  entitlement: EvaluationEntitlement | null,
): string | null {
  if (!entitlement?.canEvaluate) {
    return null;
  }

  if (entitlement.creditSource === "free") {
    return "Your first evaluation is free.";
  }

  return "This uses one credit.";
}
