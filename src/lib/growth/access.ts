import { createClient } from "@/lib/supabase/server";

export async function profileHasGrowthAccess(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("growth_access")
    .eq("id", userId)
    .maybeSingle();

  return data?.growth_access === true;
}
