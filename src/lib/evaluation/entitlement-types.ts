/** Client-safe evaluation entitlement types — no server imports. */

export type PlanTier = "coach" | "cohort";

export type EvaluationCreditSource = "free" | "subscription" | "pack";

export type EvaluationUsage = {
  planTier: PlanTier;
  used: number;
  limit: number;
  periodStart: string;
};

export type EvaluationBlockedReason =
  | "none"
  | "cooldown"
  | "monthly_limit"
  | "no_credits";

export type EvaluationEntitlement = {
  freeRemaining: number;
  packRemaining: number;
  subscriptionActive: boolean;
  usage: EvaluationUsage | null;
  canEvaluate: boolean;
  creditSource: EvaluationCreditSource | null;
  blockedReason: EvaluationBlockedReason;
};
