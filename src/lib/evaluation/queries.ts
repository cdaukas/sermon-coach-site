import { createClient } from "@/lib/supabase/server";
import type { RecentCompleteEvaluationItem, TrendArcEvaluationItem } from "./growth-report-types";
import type { CoachingNarrative } from "./coaching-schema";
import { howItPreachesSchema } from "./hip-schema";
import { parseEvaluationResult } from "./schema";
import { normalizeReportMode } from "./context";

export type { RecentCompleteEvaluationItem, TrendArcEvaluationItem } from "./growth-report-types";
import type {
  EvaluationStatus,
  EvaluationWithSermon,
  SermonEvaluationListItem,
  SermonEvaluationRow,
} from "./types";

function parseHowItPreaches(value: unknown) {
  if (value == null) {
    return null;
  }
  const parsed = howItPreachesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

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
    report_mode: normalizeReportMode(row.report_mode),
    coaching_narrative: (row.coaching_narrative as CoachingNarrative | null) ?? null,
    how_it_preaches: parseHowItPreaches(row.how_it_preaches),
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
  /** True only when status is complete and the mode-correct payload is present. */
  ready: boolean;
};

export async function getEvaluationStatus(
  evaluationId: string,
): Promise<EvaluationStatusResponse | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, error_message, overall_score, score_band, sermon_version_id, report_mode, result, coaching_narrative",
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

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("id, deleted_at")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError) {
    throw new Error(sermonError.message);
  }

  if (!sermon || sermon.deleted_at) {
    return null;
  }

  const status = row.status as EvaluationStatus;
  const debriefReady =
    row.report_mode === "debrief" && row.coaching_narrative != null;
  const diagnosticReady =
    row.report_mode !== "debrief" && row.result != null;
  const ready = status === "complete" && (debriefReady || diagnosticReady);

  return {
    id: row.id,
    status,
    errorMessage: row.error_message,
    sermonId: version.sermon_id,
    overallScore: row.overall_score,
    scoreBand: row.score_band,
    ready,
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
    .select("sermon_id, content")
    .eq("id", evaluation.sermon_version_id)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }

  let sermon: EvaluationWithSermon["sermon"] | null = null;
  let manuscriptContent: string | null = null;
  let resolvedVia: EvaluationWithSermon["resolvedVia"] = "owner";

  if (version) {
    const { data, error: sermonError } = await supabase
      .from("sermons")
      .select("id, title, primary_passage, deleted_at")
      .eq("id", version.sermon_id)
      .maybeSingle();

    if (sermonError) {
      throw new Error(sermonError.message);
    }

    if (data?.deleted_at) {
      return null;
    }

    sermon = data
      ? {
          id: data.id,
          title: data.title,
          primary_passage: data.primary_passage,
        }
      : null;
    if (sermon) {
      manuscriptContent =
        typeof version.content === "string" ? version.content : null;
    }
  }

  if (!sermon) {
    const { data: contextRows, error: contextError } = await supabase.rpc(
      "get_mentored_evaluation_context",
      { p_evaluation_id: evaluationId },
    );

    if (contextError) {
      throw new Error(contextError.message);
    }

    const context = Array.isArray(contextRows) ? contextRows[0] : contextRows;
    if (!context) {
      return null;
    }

    sermon = {
      id: context.sermon_id as string,
      title: context.sermon_title as string,
      primary_passage: (context.primary_passage as string | null) ?? null,
    };
    manuscriptContent = null;
    resolvedVia = "mentored_context";
  }

  return { evaluation, sermon, manuscriptContent, resolvedVia };
}

export async function listRecentCompleteEvaluations(
  limit?: number,
): Promise<RecentCompleteEvaluationItem[]> {
  const supabase = await createClient();

  // Diagnostics only. Debrief rows (mentoring stopgap / Coach debriefs) carry
  // scores but are not the owner's preaching arc — structural via report_mode.
  let query = supabase
    .from("sermon_evaluations")
    .select("id, completed_at, created_at, sermon_version_id, score_band")
    .eq("status", "complete")
    .eq("report_mode", "diagnostic")
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
    .in("id", sermonIds)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false);

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
    .select(
      "id, completed_at, created_at, sermon_version_id, overall_score, prompt_version",
    )
    .eq("status", "complete")
    .eq("report_mode", "diagnostic")
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
    .in("id", sermonIds)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false);

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
      promptVersion:
        typeof row.prompt_version === "string" && row.prompt_version.trim()
          ? row.prompt_version.trim()
          : "unknown",
    });
  }

  return items;
}

/**
 * True when every listed sermon is live and counted in Growth Report math.
 * Used by loadGrowthReportData; not a substitute for getEvaluationById.
 */
export async function sermonsEligibleForGrowth(
  sermonIds: string[],
): Promise<boolean> {
  const uniqueIds = [...new Set(sermonIds)];
  if (uniqueIds.length === 0) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sermons")
    .select("id")
    .in("id", uniqueIds)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length === uniqueIds.length;
}

async function sermonIsLive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sermonId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("sermons")
    .select("id, deleted_at")
    .eq("id", sermonId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data != null && data.deleted_at == null;
}

export async function listEvaluationsForSermon(
  sermonId: string,
): Promise<SermonEvaluationListItem[]> {
  const supabase = await createClient();

  if (!(await sermonIsLive(supabase, sermonId))) {
    return [];
  }

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
    report_mode: normalizeReportMode(row.report_mode),
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

  if (!(await sermonIsLive(supabase, sermonId))) {
    return false;
  }

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

  // Mentored pairs are two rows for one submission; exclude the held debrief
  // half so a pair counts as one. Unmentored rows (mentor_relationship_id null)
  // are unchanged, including Coach debriefs.
  const { count, error } = await supabase
    .from("sermon_evaluations")
    .select("id", { count: "exact", head: true })
    .in("sermon_version_id", versionIds)
    .in("status", ["pending", "running"])
    .or("mentor_relationship_id.is.null,report_mode.neq.debrief");

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}
