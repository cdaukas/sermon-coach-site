import type { EvaluationEntitlement } from "./entitlement-types";

export function formatEvaluationCreditLine(
  entitlement: EvaluationEntitlement | null,
): string | null {
  if (!entitlement?.canEvaluate) {
    return null;
  }

  if (entitlement.creditSource === "subscription" && entitlement.usage) {
    return `${entitlement.usage.used} of ${entitlement.usage.limit} credits used this month`;
  }

  if (entitlement.creditSource === "pack" && entitlement.packRemaining > 0) {
    return `${entitlement.packRemaining} pack credit${entitlement.packRemaining === 1 ? "" : "s"} remaining`;
  }

  if (entitlement.creditSource === "free" && entitlement.freeRemaining > 0) {
    return "Your first evaluation is free.";
  }

  return null;
}
