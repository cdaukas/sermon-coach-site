import { allowsCoachSurface, hasActiveCoach } from "@/lib/billing/coach-access";
import { createClient } from "@/lib/supabase/server";

export async function profileHasPrepCardAccess(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("prep_card_access, is_comped, subscription_status, plan_tier")
    .eq("id", userId)
    .maybeSingle();

  if (hasActiveCoach(data)) return true;
  return allowsCoachSurface({
    flag: data?.prep_card_access,
    is_comped: data?.is_comped,
    subscription_status: data?.subscription_status,
    plan_tier: data?.plan_tier,
  });
}

/** Deep dive uses the same access as the prep card. */
export async function profileHasDeepDiveAccess(
  userId: string,
): Promise<boolean> {
  return profileHasPrepCardAccess(userId);
}
