import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanTier = "coach" | "cohort";

export type EvaluationCreditSource = "free" | "subscription" | "pack";

export type EvaluationUsage = {
  planTier: PlanTier;
  used: number;
  limit: number;
  periodStart: string;
};

export type EvaluationEntitlement = {
  freeRemaining: number;
  subscriptionActive: boolean;
  usage: EvaluationUsage | null;
  canEvaluate: boolean;
  creditSource: EvaluationCreditSource | null;
};

const COOLDOWN_MS = 60_000;

export const NO_EVALUATION_CREDITS_CODE = "NO_EVALUATION_CREDITS" as const;

export type EligibilityGuardResult =
  | {
      ok: true;
      usage: EvaluationUsage | null;
      creditSource: EvaluationCreditSource;
      freeRemaining: number;
      subscriptionActive: boolean;
    }
  | {
      ok: false;
      error: string;
      code?: typeof NO_EVALUATION_CREDITS_CODE;
    };

/** @deprecated Use checkEvaluationEligibility */
export type QuotaGuardResult = EligibilityGuardResult;

export function tierLimit(planTier: PlanTier): number {
  switch (planTier) {
    case "coach":
      return 10;
    case "cohort":
      return 50;
    default:
      return 10;
  }
}

function startOfCurrentMonthUtc(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function periodHasExpired(periodStart: string): boolean {
  const start = new Date(`${periodStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return Date.now() >= end.getTime();
}

type ProfileBillingRow = {
  plan_tier: string;
  subscription_status: string;
  free_evaluations_remaining: number;
  evaluations_used_this_period: number;
  evaluations_period_start: string;
  last_evaluation_at: string | null;
};

async function refreshEvaluationPeriodIfNeeded(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("refresh_evaluation_period_if_needed", {
    p_user_id: userId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function loadProfileBilling(
  userId: string,
): Promise<{ ok: true; profile: ProfileBillingRow } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "plan_tier, subscription_status, free_evaluations_remaining, evaluations_used_this_period, evaluations_period_start, last_evaluation_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!profile) {
    return {
      ok: false,
      error: "Profile not found. Sign out and sign in again.",
    };
  }

  return { ok: true, profile };
}

function buildUsageFromProfile(profile: ProfileBillingRow): EvaluationUsage {
  const planTier = profile.plan_tier as PlanTier;
  let used = profile.evaluations_used_this_period;
  let periodStart = profile.evaluations_period_start;

  if (periodHasExpired(periodStart)) {
    used = 0;
    periodStart = startOfCurrentMonthUtc();
  }

  return {
    planTier,
    used,
    limit: tierLimit(planTier),
    periodStart,
  };
}

function checkCooldown(
  lastEvaluationAt: string | null,
): EligibilityGuardResult | null {
  if (!lastEvaluationAt) {
    return null;
  }

  const elapsed = Date.now() - new Date(lastEvaluationAt).getTime();
  if (elapsed < COOLDOWN_MS) {
    const secondsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return {
      ok: false,
      error: `Please wait ${secondsLeft} seconds before starting another evaluation.`,
    };
  }

  return null;
}

async function userHasLivePackCredit(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("eval_credit_grants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("quantity_remaining", 0)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(error.message);
  }
  
  return (count ?? 0) > 0;
}

/**
 * Production eligibility: free credit first, then subscription monthly quota, then pack credits.
 */
export async function checkEvaluationEligibility(
  userId: string,
): Promise<EligibilityGuardResult> {
  const refreshed = await refreshEvaluationPeriodIfNeeded(userId);
  if (!refreshed.ok) {
    return refreshed;
  }

  const loaded = await loadProfileBilling(userId);
  if (!loaded.ok) {
    return loaded;
  }

  const { profile } = loaded;
  const subscriptionActive = profile.subscription_status === "active";
  const freeRemaining = profile.free_evaluations_remaining;

  const cooldownBlock = checkCooldown(profile.last_evaluation_at);
  if (cooldownBlock) {
    return cooldownBlock;
  }

  if (freeRemaining > 0) {
    return {
      ok: true,
      creditSource: "free",
      freeRemaining,
      subscriptionActive,
      usage: subscriptionActive ? buildUsageFromProfile(profile) : null,
    };
  }

  if (subscriptionActive) {
    const usage = buildUsageFromProfile(profile);
    if (usage.used < usage.limit) {
      return {
        ok: true,
        creditSource: "subscription",
        freeRemaining: 0,
        subscriptionActive: true,
        usage,
      };
    }
  }

  if (await userHasLivePackCredit(userId)) {
    return {
      ok: true,
      creditSource: "pack",
      freeRemaining: 0,
      subscriptionActive,
      usage: subscriptionActive ? buildUsageFromProfile(profile) : null,
    };
  }

  if (subscriptionActive) {
    const usage = buildUsageFromProfile(profile);
    return {
      ok: false,
      error: `Monthly evaluation limit reached (${usage.limit} per month on ${usage.planTier.replace("_", " ")}).`,
    };
  }

  return {
    ok: false,
    error: "No evaluation credits remaining.",
    code: NO_EVALUATION_CREDITS_CODE,
  };
}

/** @deprecated Use checkEvaluationEligibility */
export async function checkEvaluationQuota(
  userId: string,
): Promise<EligibilityGuardResult> {
  return checkEvaluationEligibility(userId);
}

export async function countActiveEvaluationsForUser(
  userId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id")
    .eq("user_id", userId);

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const sermonIds = (sermons ?? []).map((s) => s.id);
  if (sermonIds.length === 0) {
    return 0;
  }

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id")
    .in("sermon_id", sermonIds);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionIds = (versions ?? []).map((v) => v.id);
  if (versionIds.length === 0) {
    return 0;
  }

  const { count, error } = await supabase
    .from("sermon_evaluations")
    .select("id", { count: "exact", head: true })
    .in("sermon_version_id", versionIds)
    .in("status", ["pending", "running"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function loadLatestCompletedEvaluationForUser(
  userId: string,
): Promise<{ id: string; creditSource: string | null } | null> {
  const supabase = await createClient();

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id")
    .eq("user_id", userId);

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const sermonIds = (sermons ?? []).map((s) => s.id);
  if (sermonIds.length === 0) {
    return null;
  }

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id")
    .in("sermon_id", sermonIds);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionIds = (versions ?? []).map((v) => v.id);
  if (versionIds.length === 0) {
    return null;
  }

  const { data: evaluation, error } = await supabase
    .from("sermon_evaluations")
    .select("id, credit_source")
    .in("sermon_version_id", versionIds)
    .eq("status", "complete")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!evaluation) {
    return null;
  }

  return {
    id: evaluation.id,
    creditSource: evaluation.credit_source,
  };
}

export async function recordEvaluationComplete(
  userId: string,
): Promise<void> {
  const completed = await loadLatestCompletedEvaluationForUser(userId);
  const creditSource = completed?.creditSource ?? null;
  const evaluationId = completed?.id ?? "unknown";

  if (creditSource === "pack") {
    const admin = createAdminClient();
    const { data: grantId, error } = await admin.rpc("consume_pack_credit", {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (grantId === null) {
      console.warn(
        `consume_pack_credit returned null (no live pack credit at consume time) for user_id=${userId} evaluation_id=${evaluationId}`,
      );
    }

    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("consume_evaluation_credit", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getEvaluationEntitlement(
  userId: string,
): Promise<EvaluationEntitlement | null> {
  const refreshed = await refreshEvaluationPeriodIfNeeded(userId);
  if (!refreshed.ok) {
    return null;
  }

  const loaded = await loadProfileBilling(userId);
  if (!loaded.ok) {
    return null;
  }

  const { profile } = loaded;
  const subscriptionActive = profile.subscription_status === "active";
  const freeRemaining = profile.free_evaluations_remaining;
  const usage = subscriptionActive ? buildUsageFromProfile(profile) : null;

  let canEvaluate = freeRemaining > 0;
  let creditSource: EvaluationCreditSource | null = canEvaluate ? "free" : null;

  if (!canEvaluate && subscriptionActive && usage) {
    canEvaluate = usage.used < usage.limit;
    creditSource = canEvaluate ? "subscription" : null;
  }

  return {
    freeRemaining,
    subscriptionActive,
    usage,
    canEvaluate,
    creditSource,
  };
}

/** @deprecated Use getEvaluationEntitlement */
export async function getEvaluationUsage(
  userId: string,
): Promise<EvaluationUsage | null> {
  const entitlement = await getEvaluationEntitlement(userId);
  return entitlement?.usage ?? null;
}
