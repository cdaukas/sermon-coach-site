"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EVALUATION_FIXTURE,
  EVALUATION_FIXTURE_PROMPT_VERSION,
} from "./fixture";
import { EVALUATION_PROMPT_VERSION } from "./prompt";
import { formatScoreBand } from "./schema";
import { processEvaluationJob } from "./processEvaluation";
import {
  checkEvaluationQuota,
  countActiveEvaluationsForUser,
} from "./quota";
import type { RequestEvaluationResult } from "./types";

async function runFixtureEvaluation(
  sermonId: string,
  versionId: string,
): Promise<RequestEvaluationResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { scoring } = EVALUATION_FIXTURE;

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: versionId,
      status: "complete",
      prompt_version: EVALUATION_FIXTURE_PROMPT_VERSION,
      result: EVALUATION_FIXTURE,
      overall_score: scoring.composite_weighted,
      score_band: formatScoreBand(scoring),
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

function mapInsertError(message: string): string {
  if (message.includes("sermon_evaluations_one_active_per_version_idx")) {
    return "An evaluation is already running for this manuscript version.";
  }
  return message;
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

  const quota = await checkEvaluationQuota(user.id);
  if (!quota.ok) {
    return { ok: false, error: quota.error };
  }

  const activeCount = await countActiveEvaluationsForUser(user.id);
  if (activeCount > 0) {
    return {
      ok: false,
      error:
        "You already have an evaluation in progress. Wait for it to finish before starting another.",
    };
  }

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: version.id,
      status: "pending",
      prompt_version: EVALUATION_PROMPT_VERSION,
    })
    .select("id")
    .single();

  if (insertError || !evaluation) {
    return {
      ok: false,
      error: mapInsertError(
        insertError?.message ?? "Failed to start evaluation.",
      ),
    };
  }

  const evaluationId = evaluation.id;

  after(async () => {
    try {
      await processEvaluationJob({
        evaluationId,
        userId: user.id,
        sermonTitle: sermon.title,
        manuscript: version.content,
      });
    } catch {
      // Row updated to failed inside processEvaluationJob
    }
  });

  return { ok: true, evaluationId, sermonId };
}
