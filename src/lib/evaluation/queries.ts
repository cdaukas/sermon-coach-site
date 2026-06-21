import { createClient } from "@/lib/supabase/server";
import type { RecentCompleteEvaluationItem, TrendArcEvaluationItem } from "./growth-report-types";
import type { CoachingNarrative } from "./coaching-schema";
import { parseEvaluationResult } from "./schema";

export type { RecentCompleteEvaluationItem, TrendArcEvaluationItem } from "./growth-report-types";
import type {
  EvaluationStatus,
  EvaluationWithSermon,
  ReportMode,
  SermonEvaluationListItem,
  SermonEvaluationRow,
} from "./types";

function mapEvaluationRow(
  row: Record<string, unknown>,
): SermonEvaluationRow | null {
  const result =
    row.result != null
      ? parseEvaluationResult(row.result, {
          promptVersion: row.prompt_version as string | null | undefined,
        })
      : null;

  if (row.status === "complete" && row.result != null && result === null) {
    return null;
  }

  return {
    id: row.id as string,
    sermon_version_id: row.sermon_version_id as string,
    status: row.status as SermonEvaluationRow["status"],
    report_mode: (row.report_mode as ReportMode | undefined) ?? "diagnostic",
    coaching_narrative: (row.coaching_narrative as CoachingNarrative | null) ?? null,
    error_message: (row.error_message as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    prompt_version: row.prompt_version as string,
    result,
    overall_score: (row.overall_score as number | null) ?? null,
    score_band: (row.score_band as string | null) ?? null,
    input_tokens: (row.input_tokens as number | null) ?? null,
    output_tokens: (row.output_tokens as number | null) ?? null,
    created_at: row.created_at as string,
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

export type EvaluationStatusResponse = {
  id: string;
  status: EvaluationStatus;
  errorMessage: string | null;
  sermonId: string;
  overallScore: number | null;
  scoreBand: string | null;
};

export async function getEvaluationStatus(
  evaluationId: string,
): Promise<EvaluationStatusResponse | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, error_message, overall_score, score_band, sermon_version_id",
    )
    .eq("id", evaluationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row) {
    return null;
  }

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("sermon_id")
    .eq("id", row.sermon_version_id)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }

  if (!version) {
    return null;
  }

  return {
    id: row.id,
    status: row.status as EvaluationStatus,
    errorMessage: row.error_message,
    sermonId: version.sermon_id,
    overallScore: row.overall_score,
    scoreBand: row.score_band,
  };
}

export async function getEvaluation(
  evaluationId: string,
  sermonId: string,
): Promise<EvaluationWithSermon | null> {
  const loaded = await getEvaluationById(evaluationId);

  if (!loaded || loaded.sermon.id !== sermonId) {
    return null;
  }

  return loaded;
}

export async function getEvaluationById(
  evaluationId: string,
): Promise<EvaluationWithSermon | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("sermon_evaluations")
    .select("*")
    .eq("id", evaluationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row) {
    return null;
  }

  const evaluation = mapEvaluationRow(row);

  if (!evaluation) {
    return null;
  }

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("sermon_id")
    .eq("id", evaluation.sermon_version_id)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }

  if (!version) {
    return null;
  }

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError) {
    throw new Error(sermonError.message);
  }

  if (!sermon) {
    return null;
  }

  return { evaluation, sermon };
}

export async function listRecentCompleteEvaluations(
  limit?: number,
): Promise<RecentCompleteEvaluationItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("sermon_evaluations")
    .select("id, completed_at, created_at, sermon_version_id, score_band")
    .eq("status", "complete")
    .not("result", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (limit != null) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return [];
  }

  const versionIds = [...new Set(rows.map((row) => row.sermon_version_id))];
  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id")
    .in("id", versionIds);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionToSermonId = new Map(
    (versions ?? []).map((version) => [version.id, version.sermon_id]),
  );

  const sermonIds = [...new Set(versionToSermonId.values())];
  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .in("id", sermonIds);

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const sermonById = new Map(
    (sermons ?? []).map((sermon) => [sermon.id, sermon]),
  );

  const items: RecentCompleteEvaluationItem[] = [];

  for (const row of rows) {
    const sermonId = versionToSermonId.get(row.sermon_version_id);
    const sermon = sermonId ? sermonById.get(sermonId) : undefined;
    if (!sermonId || !sermon?.title || !row.completed_at) {
      continue;
    }

    items.push({
      evaluationId: row.id,
      sermonId,
      sermonTitle: sermon.title,
      primaryPassage: sermon.primary_passage ?? null,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      scoreBand: row.score_band ?? "—",
    });
  }

  return items;
}

export async function listCompleteEvaluationsForTrendArc(): Promise<TrendArcEvaluationItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select("id, completed_at, created_at, sermon_version_id, overall_score")
    .eq("status", "complete")
    .not("result", "is", null)
    .not("completed_at", "is", null)
    .not("overall_score", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return [];
  }

  const versionIds = [...new Set(rows.map((row) => row.sermon_version_id))];
  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id")
    .in("id", versionIds);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionToSermonId = new Map(
    (versions ?? []).map((version) => [version.id, version.sermon_id]),
  );

  const sermonIds = [...new Set(versionToSermonId.values())];
  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title")
    .in("id", sermonIds);

  if (sermonsError) {
    throw new Error(sermonsError.message);
  }

  const sermonById = new Map(
    (sermons ?? []).map((sermon) => [sermon.id, sermon]),
  );

  const items: TrendArcEvaluationItem[] = [];

  for (const row of rows) {
    const sermonId = versionToSermonId.get(row.sermon_version_id);
    const sermon = sermonId ? sermonById.get(sermonId) : undefined;
    if (
      !sermonId ||
      !sermon?.title ||
      !row.completed_at ||
      row.overall_score == null
    ) {
      continue;
    }

    items.push({
      evaluationId: row.id,
      sermonTitle: sermon.title,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      compositeWeighted: row.overall_score,
    });
  }

  return items;
}

export async function listEvaluationsForSermon(
  sermonId: string,
): Promise<SermonEvaluationListItem[]> {
  const supabase = await createClient();

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id")
    .eq("sermon_id", sermonId);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionIds = (versions ?? []).map((v) => v.id);

  if (versionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, report_mode, overall_score, score_band, prompt_version, created_at, completed_at",
    )
    .in("sermon_version_id", versionIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status as EvaluationStatus,
    report_mode: (row.report_mode as ReportMode | undefined) ?? "diagnostic",
    overall_score: row.overall_score,
    score_band: row.score_band,
    prompt_version: row.prompt_version,
    created_at: row.created_at,
    completed_at: row.completed_at,
  }));
}

export async function sermonHasActiveEvaluation(
  sermonId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("id")
    .eq("sermon_id", sermonId);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionIds = (versions ?? []).map((v) => v.id);
  if (versionIds.length === 0) {
    return false;
  }

  const { count, error } = await supabase
    .from("sermon_evaluations")
    .select("id", { count: "exact", head: true })
    .in("sermon_version_id", versionIds)
    .in("status", ["pending", "running"]);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}
