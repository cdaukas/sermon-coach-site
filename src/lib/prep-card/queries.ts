import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PrepCardRow, PrepCardSnapshot } from "./types";

const SAMPLE_CAP = 24;

export type SermonForPrepCard = {
  id: string;
  title: string;
  content: string;
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
    .select("id, title")
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
    });
  }

  // Chronological for stable counting narration
  return rows.reverse();
}

export async function getLatestPrepCard(): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("prep_cards")
    .select(
      "id, user_id, generated_at, sample_size, source_format, ranked_measure_count, pool_note, snapshot, created_at",
    )
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    user_id: data.user_id as string,
    generated_at: data.generated_at as string,
    sample_size: data.sample_size as number,
    source_format: data.source_format as PrepCardRow["source_format"],
    ranked_measure_count: data.ranked_measure_count as number,
    pool_note: data.pool_note as string,
    snapshot: data.snapshot as PrepCardSnapshot,
    created_at: data.created_at as string,
  };
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

  return {
    id: data.id as string,
    user_id: data.user_id as string,
    generated_at: data.generated_at as string,
    sample_size: data.sample_size as number,
    source_format: data.source_format as PrepCardRow["source_format"],
    ranked_measure_count: data.ranked_measure_count as number,
    pool_note: data.pool_note as string,
    snapshot: data.snapshot as PrepCardSnapshot,
    created_at: data.created_at as string,
  };
}
