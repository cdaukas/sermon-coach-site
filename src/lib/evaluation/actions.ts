"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EVALUATION_FIXTURE,
  EVALUATION_FIXTURE_PROMPT_VERSION,
} from "./fixture";
import type { RequestEvaluationResult } from "./types";

export async function requestEvaluation(
  sermonId: string,
): Promise<RequestEvaluationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to run an evaluation." };
  }

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("id")
    .eq("id", sermonId)
    .maybeSingle();

  if (sermonError) {
    return { ok: false, error: sermonError.message };
  }

  if (!sermon) {
    return { ok: false, error: "Sermon not found." };
  }

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("id")
    .eq("sermon_id", sermonId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    return { ok: false, error: versionError.message };
  }

  if (!version) {
    return { ok: false, error: "No manuscript version found for this sermon." };
  }

  const now = new Date().toISOString();
  const { headline } = EVALUATION_FIXTURE;

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: version.id,
      status: "complete",
      prompt_version: EVALUATION_FIXTURE_PROMPT_VERSION,
      result: EVALUATION_FIXTURE,
      overall_score: headline.score,
      score_band: headline.band,
      started_at: now,
      completed_at: now,
    })
    .select("id")
    .single();

  if (insertError || !evaluation) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to save evaluation.",
    };
  }

  redirect(
    `/dashboard/sermons/${sermonId}/evaluations/${evaluation.id}`,
  );
}
