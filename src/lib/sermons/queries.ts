import { createClient } from "@/lib/supabase/server";
import type {
  DashboardSermonRow,
  SermonListItem,
  SermonWithLatestVersion,
} from "./types";

export async function listSermons(): Promise<SermonListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .select("id, title, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Dashboard home list: sermons plus latest complete evaluation summary.
 * Additive sibling of listSermons — does not change that function's return shape.
 */
export async function listDashboardSermons(): Promise<DashboardSermonRow[]> {
  const supabase = await createClient();

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, created_at")
    .order("created_at", { ascending: false });

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  if (!sermons || sermons.length === 0) {
    return [];
  }

  const sermonIds = sermons.map((sermon) => sermon.id);

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id")
    .in("sermon_id", sermonIds);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionToSermon = new Map<string, string>();
  for (const version of versions ?? []) {
    versionToSermon.set(version.id, version.sermon_id);
  }

  const versionIds = [...versionToSermon.keys()];
  const completeBySermon = new Map<
    string,
    Array<{
      id: string;
      score_band: string | null;
      completed_at: string | null;
      created_at: string;
    }>
  >();

  if (versionIds.length > 0) {
    const { data: evaluations, error: evaluationsError } = await supabase
      .from("sermon_evaluations")
      .select(
        "id, sermon_version_id, score_band, completed_at, created_at, status",
      )
      .in("sermon_version_id", versionIds)
      .eq("status", "complete")
      .order("completed_at", { ascending: false });

    if (evaluationsError) {
      throw new Error(evaluationsError.message);
    }

    for (const row of evaluations ?? []) {
      const sermonId = versionToSermon.get(row.sermon_version_id);
      if (!sermonId) continue;
      const bucket = completeBySermon.get(sermonId) ?? [];
      bucket.push({
        id: row.id,
        score_band: row.score_band,
        completed_at: row.completed_at,
        created_at: row.created_at,
      });
      completeBySermon.set(sermonId, bucket);
    }
  }

  return sermons.map((sermon) => {
    const complete = completeBySermon.get(sermon.id) ?? [];
    complete.sort((a, b) => {
      const aTime = new Date(a.completed_at ?? a.created_at).getTime();
      const bTime = new Date(b.completed_at ?? b.created_at).getTime();
      return bTime - aTime;
    });
    const latest = complete[0] ?? null;

    return {
      id: sermon.id,
      title: sermon.title,
      primary_passage: sermon.primary_passage,
      created_at: sermon.created_at,
      completeEvaluationCount: complete.length,
      latestEvaluation: latest
        ? {
            id: latest.id,
            score_band: latest.score_band,
            completed_at: latest.completed_at,
          }
        : null,
    };
  });
}

export async function getSermonWithLatestVersion(
  id: string,
): Promise<SermonWithLatestVersion | null> {
  const supabase = await createClient();

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sermonError) {
    throw new Error(sermonError.message);
  }

  if (!sermon) {
    return null;
  }

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("*")
    .eq("sermon_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }

  return { ...sermon, latest_version: version };
}
