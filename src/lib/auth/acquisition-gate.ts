import { START_PATH } from "@/lib/auth/start";

/**
 * Attribution columns shipped in
 * supabase/migrations/20260717010000_profiles_acquisition_source.sql
 * (2026-07-17). Pre-ship accounts have null acquisition_source_at by
 * backfill absence, not by unanswered prompt — never ask them.
 */
export const ATTRIBUTION_FEATURE_SHIP_DATE = "2026-07-17";

type AttributionClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: { getUser: () => PromiseLike<{ data: { user: { id: string } | null } }> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

type AttributionProfile = {
  acquisition_source_at: string | null;
  created_at: string;
};

/** True when a post-ship account has not yet resolved the attribution prompt. */
export function isEligibleForAcquisitionPrompt(
  profile: AttributionProfile | null | undefined,
): boolean {
  if (!profile?.created_at) return false;
  if (profile.acquisition_source_at != null) return false;

  const createdMs = Date.parse(profile.created_at);
  const shipMs = Date.parse(`${ATTRIBUTION_FEATURE_SHIP_DATE}T00:00:00.000Z`);
  if (Number.isNaN(createdMs) || Number.isNaN(shipMs)) return false;

  return createdMs >= shipMs;
}

/** True when the signed-in user should see the attribution prompt. */
export async function needsAcquisitionAttribution(
  supabase: AttributionClient,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("acquisition_source_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return isEligibleForAcquisitionPrompt(
    profile as AttributionProfile | null,
  );
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
