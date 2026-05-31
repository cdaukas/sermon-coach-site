import { createClient } from "@/lib/supabase/server";

export type PlanTier = "coach" | "cohort";

export type EvaluationUsage = {
  planTier: PlanTier;
  used: number;
  limit: number;
  periodStart: string;
};

const COOLDOWN_MS = 60_000;

export function tierLimit(planTier: PlanTier): number {
  switch (planTier) {
    case "coach":
      return 10;
    case "cohort":
      return 30;
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

export type QuotaGuardResult =
  | { ok: true; usage: EvaluationUsage }
  | { ok: false; error: string };

export async function checkEvaluationQuota(
  userId: string,
): Promise<QuotaGuardResult> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "plan_tier, evaluations_used_this_period, evaluations_period_start, last_evaluation_at",
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

  let used = profile.evaluations_used_this_period;
  let periodStart = profile.evaluations_period_start;
  const planTier = profile.plan_tier as PlanTier;

  if (periodHasExpired(periodStart)) {
    used = 0;
    periodStart = startOfCurrentMonthUtc();
    const { error: resetError } = await supabase
      .from("profiles")
      .update({
        evaluations_used_this_period: 0,
        evaluations_period_start: periodStart,
      })
      .eq("id", userId);

    if (resetError) {
      return { ok: false, error: resetError.message };
    }
  }

  const limit = tierLimit(planTier);

  if (used >= limit) {
    return {
      ok: false,
      error: `Monthly evaluation limit reached (${limit} per month on ${planTier.replace("_", " ")}).`,
    };
  }

  if (profile.last_evaluation_at) {
    const elapsed = Date.now() - new Date(profile.last_evaluation_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const secondsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        error: `Please wait ${secondsLeft} seconds before starting another evaluation.`,
      };
    }
  }

  return {
    ok: true,
    usage: { planTier, used, limit, periodStart },
  };
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

export async function recordEvaluationComplete(
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("evaluations_used_this_period")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      evaluations_used_this_period:
        profile.evaluations_used_this_period + 1,
      last_evaluation_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function getEvaluationUsage(
  userId: string,
): Promise<EvaluationUsage | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan_tier, evaluations_used_this_period, evaluations_period_start")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  let used = profile.evaluations_used_this_period;
  let periodStart = profile.evaluations_period_start;

  if (periodHasExpired(periodStart)) {
    used = 0;
    periodStart = startOfCurrentMonthUtc();
  }

  const planTier = profile.plan_tier as PlanTier;

  return {
    planTier,
    used,
    limit: tierLimit(planTier),
    periodStart,
  };
}
