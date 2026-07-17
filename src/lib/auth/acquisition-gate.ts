import { START_PATH } from "@/lib/auth/start";

type AttributionClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: { getUser: () => PromiseLike<{ data: { user: { id: string } | null } }> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/** True when the signed-in user has not resolved the attribution prompt. */
export async function needsAcquisitionAttribution(
  supabase: AttributionClient,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("acquisition_source_at")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.acquisition_source_at == null;
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** After confirm/login, unanswered users must hit /start before any dashboard route. */
export function destinationForPostAuth(
  nextPath: string,
  needsAttribution: boolean,
): string {
  if (needsAttribution && isDashboardPath(nextPath)) {
    return START_PATH;
  }
  return nextPath;
}
