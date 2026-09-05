import { createClient } from "@/lib/supabase/server";

export async function profileHasPrepCardAccess(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("prep_card_access")
    .eq("id", userId)
    .maybeSingle();

  return data?.prep_card_access === true;
}
