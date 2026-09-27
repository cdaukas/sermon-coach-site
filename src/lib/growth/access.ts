import { allowsCoachSurface, hasActiveCoach } from "@/lib/billing/coach-access";
import { createClient } from "@/lib/supabase/server";

export async function profileHasGrowthAccess(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("growth_access, is_comped, subscription_status, plan_tier")
    .eq("id", userId)
    .maybeSingle();

  if (hasActiveCoach(data)) return true;
  return allowsCoachSurface({
    flag: data?.growth_access,
    is_comped: data?.is_comped,
    subscription_status: data?.subscription_status,
    plan_tier: data?.plan_tier,
  });
}
