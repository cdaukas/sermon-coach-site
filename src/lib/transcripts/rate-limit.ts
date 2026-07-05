import { createAdminClient } from "@/lib/supabase/admin";

export const YOUTUBE_FETCH_COOLDOWN_MS = 10_000;
export const YOUTUBE_FETCH_DAILY_LIMIT = 20;

export type YoutubeFetchRateLimitResult =
  | { ok: true }
  | { ok: false; code: "RATE_LIMITED"; reason: "cooldown" | "daily_limit" };

function startOfUtcDayIso(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

export async function checkYoutubeFetchRateLimit(
  userId: string,
): Promise<YoutubeFetchRateLimitResult> {
  const supabase = createAdminClient();
  const dayStart = startOfUtcDayIso();
  const cooldownSince = new Date(Date.now() - YOUTUBE_FETCH_COOLDOWN_MS).toISOString();

  const { data: recent, error: recentError } = await supabase
    .from("youtube_transcript_fetches")
    .select("fetched_at")
    .eq("user_id", userId)
    .gte("fetched_at", cooldownSince)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (recentError) {
    if (
      recentError.message.includes("Could not find the table") ||
      recentError.code === "PGRST205"
    ) {
      console.warn(
        "youtube_transcript_fetches table missing — skipping rate-limit checks. Apply migration 20260707120000_youtube_transcript_fetches.sql.",
      );
      return { ok: true };
    }
    throw new Error(recentError.message);
  }

  if ((recent ?? []).length > 0) {
    return { ok: false, code: "RATE_LIMITED", reason: "cooldown" };
  }

  const { count, error: countError } = await supabase
    .from("youtube_transcript_fetches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("fetched_at", dayStart);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= YOUTUBE_FETCH_DAILY_LIMIT) {
    return { ok: false, code: "RATE_LIMITED", reason: "daily_limit" };
  }

  return { ok: true };
}

export async function recordYoutubeFetch(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("youtube_transcript_fetches").insert({
    user_id: userId,
    fetched_at: new Date().toISOString(),
  });

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.code === "PGRST205"
    ) {
      console.warn(
        "youtube_transcript_fetches table missing — fetch not logged for rate limiting.",
      );
      return;
    }
    throw new Error(error.message);
  }
}
