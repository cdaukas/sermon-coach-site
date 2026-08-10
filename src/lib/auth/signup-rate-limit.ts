/** Tuneable per-IP signup rate limits (UTC day + rolling hour). */
export const SIGNUP_MAX_PER_HOUR = 3;
export const SIGNUP_MAX_PER_DAY = 8;

/** UTC midnight today — same day-bucket shape as the Sketch limiter. */
export function startOfUtcDayIso(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Left-most x-forwarded-for hop. Missing/empty → null (caller fail-opens).
 * Does not use Sketch getClientIp ("unknown" fail-closed).
 */
export function clientIpFromForwardedFor(
  forwarded: string | null | undefined,
): string | null {
  if (forwarded == null) return null;
  const first = forwarded.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}
