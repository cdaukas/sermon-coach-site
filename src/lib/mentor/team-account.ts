import { createClient } from "@/lib/supabase/server";

export async function profileIsTeamAccount(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_team_account")
    .eq("id", userId)
    .maybeSingle();

  return data?.is_team_account === true;
}
