import { createClient } from "@/lib/supabase/server";

const COACH_MONTHLY_LIMIT = 10;

export type SubscriptionStatus =
  | { kind: "subscription"; used: number; limit: number; remaining: number }
  | { kind: "free"; freeRemaining: number };

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "subscription_status, plan_tier, evaluations_used_this_period, free_evaluations_remaining",
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  // Active subscriber: show used / limit. Coach only for now.
  // Any non-coach active tier (e.g. future cohort) falls through to no card
  // rather than render a wrong number.
  if (data.subscription_status === "active" && data.plan_tier === "coach") {
    const used = data.evaluations_used_this_period ?? 0;
    const remaining = Math.max(COACH_MONTHLY_LIMIT - used, 0);
    return {
      kind: "subscription",
      used,
      limit: COACH_MONTHLY_LIMIT,
      remaining,
    };
  }

  // Not an active subscriber: show the free-eval nudge if any remain.
  const freeRemaining = data.free_evaluations_remaining ?? 0;
  if (freeRemaining > 0) {
    return { kind: "free", freeRemaining };
  }

  // Lapsed, or free-tier with none left: render nothing.
  return null;
}
