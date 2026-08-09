import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

/** Sum of free + pack + remaining subscription credits. Shared by rail chip and strip. */
export function totalAvailableCredits(
  entitlement: EvaluationEntitlement,
): number {
  const subscriptionLeft =
    entitlement.subscriptionActive && entitlement.usage
      ? Math.max(0, entitlement.usage.limit - entitlement.usage.used)
      : 0;

  return (
    entitlement.freeRemaining +
    entitlement.packRemaining +
    subscriptionLeft
  );
}

export function formatCreditChipLabel(
  entitlement: EvaluationEntitlement | null,
): string {
  if (!entitlement) {
    return "Billing";
  }

  const total = totalAvailableCredits(entitlement);
  if (total <= 0) {
    return "Billing";
  }

  return total === 1 ? "1 credit" : `${total} credits`;
}

export type CreditStripModel = {
  subscription: { used: number; limit: number; resetLabel: string } | null;
  packRemaining: number;
  freeRemaining: number;
};

function nextResetLabel(periodStart: string): string {
  const start = new Date(`${periodStart}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return "the first";
  }
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(next);
}

export function buildCreditStripModel(
  entitlement: EvaluationEntitlement | null,
): CreditStripModel | null {
  if (!entitlement) {
    return null;
  }

  const subscription =
    entitlement.subscriptionActive && entitlement.usage
      ? {
          used: entitlement.usage.used,
          limit: entitlement.usage.limit,
          resetLabel: nextResetLabel(entitlement.usage.periodStart),
        }
      : null;

  const packRemaining = entitlement.packRemaining;
  const freeRemaining = entitlement.freeRemaining;

  if (!subscription && packRemaining <= 0 && freeRemaining <= 0) {
    return null;
  }

  return { subscription, packRemaining, freeRemaining };
}

/** Visible strip total — must match the rail chip. */
export function creditStripTotal(model: CreditStripModel): number {
  const subscriptionLeft = model.subscription
    ? Math.max(0, model.subscription.limit - model.subscription.used)
    : 0;
  return subscriptionLeft + model.packRemaining + model.freeRemaining;
}
