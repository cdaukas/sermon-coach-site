import { createAdminClient } from "@/lib/supabase/admin";
import { howItPreachesSchema } from "./hip-schema";
import { parseEvaluationResult } from "./schema";
import type { EvaluationResultStrict } from "./schema";
import type { HowItPreaches } from "./hip-schema";

export type PublicSampleEvaluation = {
  evaluationId: string;
  result: EvaluationResultStrict;
  howItPreaches: HowItPreaches | null;
  sermonTitle: string;
  primaryPassage: string | null;
};

/**
 * Load the single flagged public sample evaluation via service role.
 * Does not loosen RLS. Returns null when no row is flagged or parse fails.
 */
export async function getPublicSampleEvaluation(): Promise<PublicSampleEvaluation | null> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("sermon_evaluations")
    .select(
      "id, status, report_mode, result, how_it_preaches, prompt_version, sermon_version_id",
    )
    .eq("is_public_sample", true)
    .eq("status", "complete")
    .maybeSingle();

  if (error) {
    console.error("[getPublicSampleEvaluation] select failed", error);
    return null;
  }

  if (!row || row.report_mode === "debrief" || row.result == null) {
    return null;
  }

  const result = parseEvaluationResult(row.result, {
    promptVersion: row.prompt_version as string | null | undefined,
  });

  if (!result) {
    console.error(
      "[getPublicSampleEvaluation] result JSON failed schema parse",
      { evaluationId: row.id },
    );
    return null;
  }

  const { data: version, error: versionError } = await admin
    .from("sermon_versions")
    .select("sermon_id")
    .eq("id", row.sermon_version_id)
    .maybeSingle();

  if (versionError || !version) {
    console.error(
      "[getPublicSampleEvaluation] sermon_version lookup failed",
      versionError,
    );
    return null;
  }

  const { data: sermon, error: sermonError } = await admin
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError || !sermon) {
    console.error(
      "[getPublicSampleEvaluation] sermon lookup failed",
      sermonError,
    );
    return null;
  }

  const howParsed =
    row.how_it_preaches == null
      ? null
      : howItPreachesSchema.safeParse(row.how_it_preaches);

  return {
    evaluationId: row.id as string,
    result,
    howItPreaches: howParsed?.success ? howParsed.data : null,
    sermonTitle: sermon.title as string,
    primaryPassage: (sermon.primary_passage as string | null) ?? null,
  };
}
