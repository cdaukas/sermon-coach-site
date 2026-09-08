import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import type { PrepSermonInput } from "@/lib/prep-card/build";
import type { MovementThemeId } from "./themes";
import type {
  MovementBaseline,
  MovementCount,
  MovementReportSnapshot,
} from "./types";

function mapBaseline(row: Record<string, unknown>): MovementBaseline {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    themeId: row.theme_id as MovementThemeId,
    focusMeasureIds: row.focus_measure_ids as PrepMeasureId[],
    baselineCounts: row.baseline_counts as MovementCount[],
    sermonIds: (row.sermon_ids as string[]) ?? [],
    sampleLabel: (row.sample_label as string | null) ?? null,
    generatedAt: row.generated_at as string,
    prepCardId: (row.prep_card_id as string | null) ?? null,
  };
}

export async function getOpenMovementBaseline(
  userId: string,
): Promise<MovementBaseline | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movement_baselines")
    .select(
      "id, user_id, theme_id, focus_measure_ids, baseline_counts, sermon_ids, sample_label, generated_at, prep_card_id",
    )
    .eq("user_id", userId)
    .is("closed_at", null)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return mapBaseline(data);
}

export async function insertMovementBaseline(params: {
  userId: string;
  themeId: MovementThemeId;
  focusMeasureIds: PrepMeasureId[];
  baselineCounts: MovementCount[];
  sermonIds: string[];
  sampleLabel?: string | null;
  prepCardId?: string | null;
  generatedAt?: string;
}): Promise<MovementBaseline> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("movement_baselines")
    .insert({
      user_id: params.userId,
      theme_id: params.themeId,
      focus_measure_ids: params.focusMeasureIds,
      baseline_counts: params.baselineCounts,
      sermon_ids: params.sermonIds,
      sample_label: params.sampleLabel ?? null,
      prep_card_id: params.prepCardId ?? null,
      generated_at: params.generatedAt ?? new Date().toISOString(),
    })
    .select(
      "id, user_id, theme_id, focus_measure_ids, baseline_counts, sermon_ids, sample_label, generated_at, prep_card_id",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "movement_baselines insert failed");
  }
  return mapBaseline(data);
}

export async function getLatestMovementReport(
  userId: string,
): Promise<{
  id: string;
  baselineId: string;
  generatedAt: string;
  snapshot: MovementReportSnapshot;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movement_reports")
    .select("id, baseline_id, generated_at, snapshot")
    .eq("user_id", userId)
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
    baselineId: data.baseline_id as string,
    generatedAt: data.generated_at as string,
    snapshot: data.snapshot as MovementReportSnapshot,
  };
}

export async function insertMovementReport(params: {
  userId: string;
  baselineId: string;
  themeId: MovementThemeId;
  comparisonSampleSize: number;
  snapshot: MovementReportSnapshot;
}): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("movement_reports")
    .insert({
      user_id: params.userId,
      baseline_id: params.baselineId,
      theme_id: params.themeId,
      generated_at: params.snapshot.generatedAt,
      comparison_sample_size: params.comparisonSampleSize,
      snapshot: params.snapshot,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "movement_reports insert failed");
  }
  return { id: data.id as string };
}

/**
 * Sermons preached after the baseline lock, excluding the baseline set.
 */
export async function loadComparisonSermons(params: {
  userId: string;
  baselineSermonIds: string[];
  afterIso: string;
}): Promise<PrepSermonInput[]> {
  const supabase = createAdminClient();
  const baselineSet = new Set(params.baselineSermonIds);

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, created_at")
    .eq("user_id", params.userId)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false)
    .gt("created_at", params.afterIso)
    .order("created_at", { ascending: true });

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const candidates = (sermons ?? []).filter((row) => !baselineSet.has(row.id));
  if (candidates.length === 0) {
    return [];
  }

  const ids = candidates.map((row) => row.id);
  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("sermon_id, content, created_at")
    .in("sermon_id", ids)
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const latest = new Map<string, string>();
  for (const version of versions ?? []) {
    if (latest.has(version.sermon_id)) {
      continue;
    }
    if (typeof version.content === "string" && version.content.trim()) {
      latest.set(version.sermon_id, version.content);
    }
  }

  const out: PrepSermonInput[] = [];
  for (const sermon of candidates) {
    const content = latest.get(sermon.id);
    if (!content) {
      continue;
    }
    out.push({
      id: sermon.id,
      title: typeof sermon.title === "string" ? sermon.title : "Sermon",
      content,
    });
  }
  return out;
}

export async function loadSermonsByIds(
  sermonIds: string[],
): Promise<PrepSermonInput[]> {
  if (sermonIds.length === 0) {
    return [];
  }
  const supabase = createAdminClient();
  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title")
    .in("id", sermonIds);

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("sermon_id, content, created_at")
    .in("sermon_id", sermonIds)
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const latest = new Map<string, string>();
  for (const version of versions ?? []) {
    if (latest.has(version.sermon_id)) {
      continue;
    }
    if (typeof version.content === "string" && version.content.trim()) {
      latest.set(version.sermon_id, version.content);
    }
  }

  const byId = new Map((sermons ?? []).map((row) => [row.id, row] as const));
  const out: PrepSermonInput[] = [];
  for (const id of sermonIds) {
    const sermon = byId.get(id);
    const content = latest.get(id);
    if (!sermon || !content) {
      continue;
    }
    out.push({
      id,
      title: typeof sermon.title === "string" ? sermon.title : "Sermon",
      content,
    });
  }
  return out;
}

export async function countComparisonSermons(params: {
  userId: string;
  baselineSermonIds: string[];
  afterIso: string;
}): Promise<number> {
  const rows = await loadComparisonSermons(params);
  return rows.length;
}
