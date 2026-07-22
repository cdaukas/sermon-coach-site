import { createAdminClient } from "@/lib/supabase/admin";

export const RUN_COOLDOWN_MS = 20_000;
export const RUN_DAILY_PER_IP = 5;
export const SAVE_COOLDOWN_MS = 5_000;
export const SAVE_DAILY_PER_IP = 10;
export const RUN_DAILY_SITEWIDE = 300;
export const SAVE_DAILY_SITEWIDE = 500;

export type SketchRateAction = "run" | "save";

export type SketchRateLimitResult =
  | { ok: true }
  | { ok: false; reason: "cooldown" | "daily_ip" | "daily_sitewide" };

const LIMITS = {
  run: {
    cooldownMs: RUN_COOLDOWN_MS,
    dailyPerIp: RUN_DAILY_PER_IP,
    dailySitewide: RUN_DAILY_SITEWIDE,
  },
  save: {
    cooldownMs: SAVE_COOLDOWN_MS,
    dailyPerIp: SAVE_DAILY_PER_IP,
    dailySitewide: SAVE_DAILY_SITEWIDE,
  },
} as const;

/** UTC midnight today — same day-bucket shape as the YouTube limiter. */
export function startOfUtcDayIso(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Client IP for rate limiting. On Vercel, x-forwarded-for left-most entry
 * is the observed client. Never use the whole header — callers can append.
 * Missing header → shared 'unknown' bucket (safe / fail-closed direction).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown";
}

function isMissingTableError(error: {
  message?: string;
  code?: string;
}): boolean {
  return (
    (error.message ?? "").includes("Could not find the table") ||
    error.code === "PGRST205"
  );
}

/**
 * Fail closed. Any query error or missing table blocks the expensive call.
 * Optional tableName is for verification only — production always uses
 * sketch_rate_events.
 */
export async function checkSketchRateLimit(
  ip: string,
  action: SketchRateAction,
  options?: { tableName?: string },
): Promise<SketchRateLimitResult> {
  const table = options?.tableName ?? "sketch_rate_events";
  const limits = LIMITS[action];
  const supabase = createAdminClient();
  const dayStart = startOfUtcDayIso();
  const cooldownSince = new Date(Date.now() - limits.cooldownMs).toISOString();

  const { data: recent, error: recentError } = await supabase
    .from(table)
    .select("created_at")
    .eq("ip", ip)
    .eq("action", action)
    .gte("created_at", cooldownSince)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentError) {
    console.error("checkSketchRateLimit cooldown query failed", recentError);
    return { ok: false, reason: "daily_sitewide" };
  }

  if ((recent ?? []).length > 0) {
    return { ok: false, reason: "cooldown" };
  }

  const { count: ipCount, error: ipCountError } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("action", action)
    .gte("created_at", dayStart);

  if (ipCountError) {
    console.error("checkSketchRateLimit daily_ip query failed", ipCountError);
    return { ok: false, reason: "daily_sitewide" };
  }

  if ((ipCount ?? 0) >= limits.dailyPerIp) {
    return { ok: false, reason: "daily_ip" };
  }

  const { count: siteCount, error: siteCountError } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .gte("created_at", dayStart);

  if (siteCountError) {
    console.error(
      "checkSketchRateLimit daily_sitewide query failed",
      siteCountError,
    );
    return { ok: false, reason: "daily_sitewide" };
  }

  if ((siteCount ?? 0) >= limits.dailySitewide) {
    return { ok: false, reason: "daily_sitewide" };
  }

  return { ok: true };
}

/**
 * Record one rate-limit event. Warn-and-continue on failure — under-count
 * only; never over-charges. Missing table is logged, not thrown.
 */
export async function recordSketchEvent(
  ip: string,
  action: SketchRateAction,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sketch_rate_events").insert({
    ip,
    action,
  });

  if (error) {
    if (isMissingTableError(error)) {
      console.warn(
        "sketch_rate_events table missing — event not recorded for rate limiting. Apply migration 20260721200000_sketch_rate_events.sql.",
      );
      return;
    }
    console.warn("recordSketchEvent insert failed", error);
  }
}
