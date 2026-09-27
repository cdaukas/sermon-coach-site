/**
 * Active Coach subscription, monthly or annual.
 * Stripe trialing is stored as subscription_status 'active'.
 * Interval is not part of the check: month and year are the same row.
 */
export function hasActiveCoach(profile: {
  subscription_status?: string | null;
  plan_tier?: string | null;
  /** month or year. Not read: both cadences are an active Coach row. */
  subscription_interval?: string | null;
} | null | undefined): boolean {
  return (
    profile?.subscription_status === "active" && profile?.plan_tier === "coach"
  );
}

export type CoachSurfaceProfile = {
  /** Manual override: growth_access or prep_card_access. */
  flag?: boolean | null;
  is_comped?: boolean | null;
  subscription_status?: string | null;
  plan_tier?: string | null;
  subscription_interval?: string | null;
};

/**
 * Flag, comp, or an active Coach subscription.
 * Seat-only, pack-only, and free accounts fail all three.
 */
export function allowsCoachSurface(
  profile: CoachSurfaceProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return (
    profile.flag === true ||
    profile.is_comped === true ||
    hasActiveCoach(profile)
  );
}
