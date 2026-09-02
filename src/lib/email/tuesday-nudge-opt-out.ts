import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findAuthUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const wanted = normalizeEmail(email);
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    }
    for (const user of data.users) {
      if (normalizeEmail(user.email ?? "") === wanted) {
        return user.id;
      }
    }
    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return null;
}

export async function optOutTuesdayNudgeByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "update_failed" }> {
  const userId = await findAuthUserIdByEmail(supabase, email);
  if (!userId) {
    return { ok: false, error: "not_found" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tuesday_nudge_opted_in: false })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: "update_failed" };
  }

  return { ok: true };
}
