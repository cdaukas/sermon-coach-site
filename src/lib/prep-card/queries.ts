import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PrepCardRow, PrepCardSnapshot } from "./types";

const SAMPLE_CAP = 24;

export type SermonForPrepCard = {
  id: string;
  title: string;
  content: string;
  primaryPassage?: string | null;
};

/**
 * Latest non-deleted sermons with newest version content, oldest-first
 * within the window so the sample is stable.
 */
export async function loadSermonsForPrepCard(
  userId: string,
  limit: number = SAMPLE_CAP,
): Promise<SermonForPrepCard[]> {
  const supabase = createAdminClient();

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sermonsError) {
    throw new Error(`prep card sermons: ${sermonsError.message}`);
  }
  if (!sermons || sermons.length === 0) {
    return [];
  }

  const sermonIds = sermons.map((row) => row.id);
  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id, content, created_at")
    .in("sermon_id", sermonIds)
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(`prep card versions: ${versionsError.message}`);
  }

  const latestContent = new Map<string, string>();
  for (const version of versions ?? []) {
    if (latestContent.has(version.sermon_id)) {
      continue;
    }
    if (typeof version.content === "string" && version.content.trim()) {
      latestContent.set(version.sermon_id, version.content);
    }
  }

  const rows: SermonForPrepCard[] = [];
  for (const sermon of sermons) {
    const content = latestContent.get(sermon.id);
    if (!content) {
      continue;
    }
    rows.push({
      id: sermon.id,
      title: typeof sermon.title === "string" ? sermon.title : "Sermon",
      content,
      primaryPassage:
        typeof sermon.primary_passage === "string"
          ? sermon.primary_passage
          : null,
    });
  }

  // Chronological for stable counting narration
  return rows.reverse();
}

function mapPrepCardRow(row: Record<string, unknown>): PrepCardRow {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    generated_at: row.generated_at as string,
    sample_size: row.sample_size as number,
    source_format: row.source_format as PrepCardRow["source_format"],
    ranked_measure_count: row.ranked_measure_count as number,
    pool_note: row.pool_note as string,
    snapshot: row.snapshot as PrepCardSnapshot,
    created_at: row.created_at as string,
  };
}

async function listRecentPrepCardRows(
  userId: string,
  limit = 20,
): Promise<PrepCardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_cards")
    .select(
      "id, user_id, generated_at, sample_size, source_format, ranked_measure_count, pool_note, snapshot, created_at",
    )
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => mapPrepCardRow(row));
}

function isAskDiagnostic(snapshot: PrepCardSnapshot): boolean {
  return snapshot.themeId === "ask" || snapshot.themeId == null;
}

function isChristDiagnostic(snapshot: PrepCardSnapshot): boolean {
  return snapshot.themeId === "christ";
}

function isDeskCard(snapshot: PrepCardSnapshot): boolean {
  return snapshot.themeId === "desk";
}

function isThemeDiagnostic(snapshot: PrepCardSnapshot): boolean {
  return isAskDiagnostic(snapshot) || isChristDiagnostic(snapshot);
}

/** Ask-theme diagnostic (legacy rows without themeId count as ask). */
export async function getLatestAskThemeReport(): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const rows = await listRecentPrepCardRows(user.id);
  return rows.find((row) => isAskDiagnostic(row.snapshot)) ?? null;
}

/**
 * @deprecated Prefer getLatestAskThemeReport or getLatestDeskCard.
 * Kept for callers that still mean "ask diagnostic, not christ."
 */
export async function getLatestPrepCard(): Promise<PrepCardRow | null> {
  return getLatestAskThemeReport();
}

export async function getLatestChristThemeReport(): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const rows = await listRecentPrepCardRows(user.id);
  return rows.find((row) => isChristDiagnostic(row.snapshot)) ?? null;
}

/** One-page desk prep card. */
export async function getLatestDeskCard(): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const rows = await listRecentPrepCardRows(user.id);
  return rows.find((row) => isDeskCard(row.snapshot)) ?? null;
}

/**
 * Latest theme diagnostic across ask and christ (by generated_at).
 * Desk cards are excluded.
 */
export async function getLatestThemeDiagnostic(): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const rows = await listRecentPrepCardRows(user.id);
  return rows.find((row) => isThemeDiagnostic(row.snapshot)) ?? null;
}

export async function insertPrepCard(
  userId: string,
  snapshot: PrepCardSnapshot,
): Promise<PrepCardRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prep_cards")
    .insert({
      user_id: userId,
      generated_at: snapshot.generatedAt,
      sample_size: snapshot.sampleSize,
      source_format: snapshot.sourceFormat,
      ranked_measure_count: snapshot.rankedMeasureCount,
      pool_note: snapshot.poolNote,
      snapshot,
    })
    .select(
      "id, user_id, generated_at, sample_size, source_format, ranked_measure_count, pool_note, snapshot, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "prep_cards insert failed");
  }

  return mapPrepCardRow(data);
}
