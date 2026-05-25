"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EVALUATION_FIXTURE,
  EVALUATION_FIXTURE_PROMPT_VERSION,
} from "./fixture";
import { EVALUATION_PROMPT_VERSION } from "./prompt";
import { EvaluationRunError, runEvaluation } from "./runEvaluation";
import type { RequestEvaluationResult } from "./types";

function userSafeError(error: unknown): string {
  if (error instanceof EvaluationRunError) {
    if (error.code === "config") {
      return "Evaluation is not configured. Add ANTHROPIC_API_KEY to the server environment.";
    }
    if (error.code === "schema" || error.code === "tool") {
      return "We couldn't generate a valid evaluation. Please try again.";
    }
    return "The evaluation service is temporarily unavailable. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong running the evaluation.";
}

async function runFixtureEvaluation(
  sermonId: string,
  versionId: string,
): Promise<RequestEvaluationResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { headline } = EVALUATION_FIXTURE;

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: versionId,
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

  redirect(`/dashboard/sermons/${sermonId}/evaluations/${evaluation.id}`);
}

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
    .select("id, title")
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
    .select("id, content")
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

  if (process.env.EVALUATION_USE_STUB === "1") {
    return runFixtureEvaluation(sermonId, version.id);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error:
        "Evaluation is not configured. Add ANTHROPIC_API_KEY to .env.local.",
    };
  }

  const startedAt = new Date().toISOString();

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: version.id,
      status: "running",
      prompt_version: EVALUATION_PROMPT_VERSION,
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (insertError || !evaluation) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to start evaluation.",
    };
  }

  const evaluationId = evaluation.id;

  try {
    const { result, model, inputTokens, outputTokens } = await runEvaluation({
      sermonTitle: sermon.title,
      manuscript: version.content,
    });

    const completedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("sermon_evaluations")
      .update({
        status: "complete",
        model,
        result,
        overall_score: result.headline.score,
        score_band: result.headline.band,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        completed_at: completedAt,
      })
      .eq("id", evaluationId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    await supabase
      .from("sermon_evaluations")
      .update({
        status: "failed",
        error_message: userSafeError(error),
        completed_at: new Date().toISOString(),
      })
      .eq("id", evaluationId);

    return { ok: false, error: userSafeError(error) };
  }

  redirect(`/dashboard/sermons/${sermonId}/evaluations/${evaluationId}`);
}
