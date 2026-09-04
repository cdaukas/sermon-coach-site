"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EVALUATION_FIXTURE,
  EVALUATION_FIXTURE_PROMPT_VERSION,
} from "./fixture";
import { EVALUATION_PROMPT_VERSION } from "./prompt";
import { formatScoreBandStrict } from "./schema";
import { processEvaluationJob } from "./processEvaluation";
import {
  checkEvaluationEligibility,
  countActiveEvaluationsForUser,
  NO_EVALUATION_CREDITS_CODE,
} from "./quota";
import { isEvaluationStubEnabled } from "./stub";
import type { SermonContext } from "./context";
import {
  ACTIVE_EVAL_IN_PROGRESS_ERROR,
  MENTORED_ALLOTMENT_EXHAUSTED_ERROR,
  MENTORED_ALREADY_IN_FLIGHT_ERROR,
  MENTORED_NO_SEAT_CAPACITY_ERROR,
} from "./eval-start-errors";
import type { ReportMode, RequestEvaluationResult } from "./types";
import { isMentoringDebriefAllowed } from "@/lib/mentor/uiAccess";
import {
  resolveRequestedOutputLanguage,
  type OutputLanguage,
} from "./output-language";

const MENTORED_GENERIC_FAILURE =
  "Something went wrong. Please try again.";

const DEBRIEF_NOT_ALLOWED =
  "The Mentoring Debrief is not available for this account.";

type CreateMentoredEvaluationRpcResult = {
  ok?: boolean;
  error_code?: string | null;
  diagnostic_id?: string;
  debrief_id?: string;
};

async function runFixtureEvaluation(
  sermonId: string,
  versionId: string,
  reportMode: ReportMode = "diagnostic",
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
      score_band: formatScoreBandStrict(scoring),
      report_mode: reportMode,
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
  context?: SermonContext,
  reportMode: ReportMode = "diagnostic",
  outputLanguage: OutputLanguage = "en",
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
    .select("id, title, primary_passage")
    .eq("id", sermonId)
    .is("deleted_at", null)
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

  if (isEvaluationStubEnabled()) {
    return runFixtureEvaluation(sermonId, version.id, reportMode);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error:
        "Evaluation is not configured. Add ANTHROPIC_API_KEY to .env.local.",
    };
  }

  const { data: relationship, error: relationshipError } = await supabase
    .from("mentor_relationships")
    .select("id")
    .eq("mentee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (relationshipError) {
    return { ok: false, error: MENTORED_GENERIC_FAILURE };
  }

  if (relationship) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_mentored_evaluation",
      {
        p_sermon_version_id: version.id,
        p_prompt_version: EVALUATION_PROMPT_VERSION,
      },
    );

    if (rpcError) {
      return { ok: false, error: MENTORED_GENERIC_FAILURE };
    }

    const result = rpcData as CreateMentoredEvaluationRpcResult | null;

    if (
      result?.ok === true &&
      typeof result.diagnostic_id === "string" &&
      typeof result.debrief_id === "string"
    ) {
      const evaluationId = result.diagnostic_id;
      const debriefEvaluationId = result.debrief_id;

      after(async () => {
        try {
          await processEvaluationJob({
            evaluationId,
            debriefEvaluationId,
            userId: user.id,
            sermonTitle: sermon.title,
            manuscript: version.content,
            context,
            primaryPassage: sermon.primary_passage,
          });
        } catch {
          // Pair updated to failed inside processEvaluationJob
        }
      });

      return {
        ok: true,
        evaluationId,
        debriefEvaluationId,
        sermonId,
      };
    }

    const code = result?.error_code;
    if (code === "allotment_exhausted") {
      return { ok: false, error: MENTORED_ALLOTMENT_EXHAUSTED_ERROR };
    }
    if (code === "already_in_flight") {
      return { ok: false, error: MENTORED_ALREADY_IN_FLIGHT_ERROR };
    }
    if (code === "no_seat_capacity") {
      return { ok: false, error: MENTORED_NO_SEAT_CAPACITY_ERROR };
    }
    if (code === "not_authenticated") {
      return {
        ok: false,
        error: "You must be signed in to run an evaluation.",
      };
    }

    return { ok: false, error: MENTORED_GENERIC_FAILURE };
  }

  // Stopgap only: ordinary debrief reuses the Coach credit path.
  // MENTORING_DEBRIEF_ALLOWLIST is independent of the mentoring UI/seat allowlist.
  if (reportMode === "debrief" && !isMentoringDebriefAllowed(user.id)) {
    return { ok: false, error: DEBRIEF_NOT_ALLOWED };
  }

  const { data: languageProfile } = await supabase
    .from("profiles")
    .select("report_language")
    .eq("id", user.id)
    .maybeSingle();
  const resolvedLanguage = resolveRequestedOutputLanguage(
    languageProfile?.report_language ?? outputLanguage,
  );

  const eligibility = await checkEvaluationEligibility(user.id);
  if (!eligibility.ok) {
    if (eligibility.code === NO_EVALUATION_CREDITS_CODE) {
      redirect("/pricing.html");
    }
    return { ok: false, error: eligibility.error, code: eligibility.code };
  }

  const activeCount = await countActiveEvaluationsForUser(user.id);
  if (activeCount > 0) {
    return {
      ok: false,
      error: ACTIVE_EVAL_IN_PROGRESS_ERROR,
    };
  }

  const { data: evaluation, error: insertError } = await supabase
    .from("sermon_evaluations")
    .insert({
      sermon_version_id: version.id,
      status: "pending",
      prompt_version: EVALUATION_PROMPT_VERSION,
      credit_source: eligibility.creditSource,
      report_mode: reportMode,
      output_language: resolvedLanguage,
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
        context,
        primaryPassage: sermon.primary_passage,
      });
    } catch {
      // Row updated to failed inside processEvaluationJob
    }
  });

  return { ok: true, evaluationId, sermonId };
}
