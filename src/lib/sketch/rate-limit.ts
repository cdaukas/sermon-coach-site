import { createAdminClient } from "@/lib/supabase/admin";

export const RUN_COOLDOWN_MS = 20_000;
export const RUN_DAILY_PER_IP = 5;
export const SAVE_COOLDOWN_MS = 5_000;
export const SAVE_DAILY_PER_IP = 10;
export const RUN_DAILY_SITEWIDE = 15;
export const SAVE_DAILY_SITEWIDE = 500;
/** Dashboard /api/readiness-read: per authenticated user, UTC day. */
export const AUTHED_RUN_DAILY_PER_USER = 5;

export const AUTHED_SKETCH_DAILY_LIMIT_MESSAGE =
  "You've reached today's Sketch limit. It resets tomorrow.";

export type SketchRateAction = "run" | "save" | "authed_run";

export type SketchRateLimitResult =
  | { ok: true }
  | { ok: false; reason: "cooldown" | "daily_ip" | "daily_sitewide" };

export type AuthedSketchDailyLimitResult =
  | { ok: true }
  | { ok: false; reason: "daily_user" };

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
  action: "run" | "save",
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
 * Per-user daily cap for /api/readiness-read.
 * Uses sketch_rate_events with action = 'authed_run' and ip = user_id
 * (subject key). Separate from public run/save so sitewide public counters
 * stay untouched. Fail closed on query errors.
 *
 * Not counted from readiness_reads: that insert is best-effort and can
 * silently fail after a paid Opus call, which would undercount and leak.
 */
export async function checkAuthedSketchDailyLimit(
  userId: string,
  options?: { tableName?: string },
): Promise<AuthedSketchDailyLimitResult> {
  const table = options?.tableName ?? "sketch_rate_events";
  const supabase = createAdminClient();
  const dayStart = startOfUtcDayIso();

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("ip", userId)
    .eq("action", "authed_run")
    .gte("created_at", dayStart);

  // Fail closed on query errors. Also treat a null count with no error as
  // unsafe (observed with missing-table head:true probes that return null/null).
  if (error || count == null) {
    console.error("checkAuthedSketchDailyLimit query failed", error ?? {
      message: "count was null without error",
    });
    return { ok: false, reason: "daily_user" };
  }

  if (count >= AUTHED_RUN_DAILY_PER_USER) {
    return { ok: false, reason: "daily_user" };
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

/**
 * Record an authed Sketch attempt before Opus. Returns false if the insert
 * failed so the caller can block generation — otherwise a silent miss would
 * undercount and leak spend past the daily cap.
 */
export async function recordAuthedSketchEvent(
  userId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sketch_rate_events").insert({
    ip: userId,
    action: "authed_run",
  });

  if (error) {
    console.error("recordAuthedSketchEvent insert failed", error);
    return false;
  }

  return true;
}
