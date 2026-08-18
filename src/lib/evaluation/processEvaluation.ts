import { createAdminClient } from "@/lib/supabase/admin";
import type { SermonContext } from "./context";
import {
  CoachingNarrativeError,
  runCoachingNarrative,
} from "./runCoachingNarrative";
import {
  runCriterionVerdictLinesBestEffort,
} from "./runCriterionVerdictLines";
import { runHowItPreachesBestEffort } from "./runHowItPreaches";
import { formatScoreBandStrict } from "./schema";
import { recordEvaluationComplete } from "./quota";
import { runEvaluation, EvaluationRunError } from "./runEvaluation";
import { normalizeReportMode } from "./context";
import { parseOutputLanguage } from "./output-language";

export type ProcessEvaluationInput = {
  evaluationId: string;
  userId: string;
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
  primaryPassage?: string | null;
  /** Present for a mentored pair: the debrief row id. Never enqueued alone. */
  debriefEvaluationId?: string;
};

type MentoredRpcResult = {
  ok?: boolean;
  error_code?: string | null;
};

function userSafeError(error: unknown): string {
  if (error instanceof EvaluationRunError) {
    if (error.code === "schema" || error.code === "tool") {
      return "We couldn't generate a valid evaluation. Please try again.";
    }
    return "The evaluation service is temporarily unavailable. Please try again.";
  }

  if (error instanceof CoachingNarrativeError) {
    if (error.code === "schema" || error.code === "tool") {
      return "We couldn't generate a valid coaching report. Please try again.";
    }
    return "The coaching narrative service is temporarily unavailable. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong running the evaluation.";
}

async function processMentoredEvaluationJob(
  input: ProcessEvaluationInput & { debriefEvaluationId: string },
): Promise<void> {
  const supabase = createAdminClient();
  const {
    evaluationId,
    debriefEvaluationId,
    userId,
    sermonTitle,
    manuscript,
    context,
    primaryPassage,
  } = input;

  const { data: claimData, error: claimError } = await supabase.rpc(
    "claim_mentored_evaluation",
    {
      p_diagnostic_id: evaluationId,
      p_debrief_id: debriefEvaluationId,
    },
  );

  if (claimError) {
    throw new Error(claimError.message);
  }

  const claim = claimData as MentoredRpcResult | null;
  if (claim?.ok !== true) {
    if (claim?.error_code === "diagnostic_not_claimable") {
      return;
    }
    throw new Error(
      claim?.error_code ?? "claim_mentored_evaluation failed.",
    );
  }

  try {
    const { result: scoredResult, model, inputTokens, outputTokens } =
      await runEvaluation({
        sermonTitle,
        manuscript,
        context,
        primaryPassage: primaryPassage?.trim() || undefined,
      });

    let result = scoredResult;

    const coaching = await runCoachingNarrative({
      result,
      manuscript,
      sermonTitle,
      primaryPassage,
      context,
    });

    let billedInputTokens = inputTokens + coaching.inputTokens;
    let billedOutputTokens = outputTokens + coaching.outputTokens;

    const logContext = { evaluationId, userId };
    const [verdictPass, hip] = await Promise.all([
      runCriterionVerdictLinesBestEffort(result, logContext),
      runHowItPreachesBestEffort(
        {
          manuscript,
          sermonTitle,
          primaryPassage,
          context,
        },
        logContext,
      ),
    ]);

    result = verdictPass.result;
    billedInputTokens += verdictPass.inputTokens + hip.inputTokens;
    billedOutputTokens += verdictPass.outputTokens + hip.outputTokens;

    const { data: completeData, error: completeError } = await supabase.rpc(
      "complete_mentored_evaluation",
      {
        p_diagnostic_id: evaluationId,
        p_debrief_id: debriefEvaluationId,
        p_model: model,
        p_result: result,
        p_overall_score: result.scoring.composite_weighted,
        p_score_band: formatScoreBandStrict(result.scoring),
        p_coaching_narrative: coaching.narrative,
        p_how_it_preaches: hip.howItPreaches,
        p_input_tokens: billedInputTokens,
        p_output_tokens: billedOutputTokens,
      },
    );

    if (completeError) {
      throw new Error(completeError.message);
    }

    const complete = completeData as MentoredRpcResult | null;
    if (complete?.ok !== true) {
      throw new Error(
        complete?.error_code ?? "complete_mentored_evaluation failed.",
      );
    }
  } catch (error) {
    await supabase.rpc("fail_mentored_evaluation", {
      p_diagnostic_id: evaluationId,
      p_debrief_id: debriefEvaluationId,
      p_error_message: userSafeError(error),
    });

    throw error;
  }
}

export async function processEvaluationJob(
  input: ProcessEvaluationInput,
): Promise<void> {
  // Runs inside after(), detached from the request — must not depend on the
  // user's session surviving the job. All three UPDATEs scope by primary key,
  // which is what makes losing RLS safe here.
  if (typeof input.debriefEvaluationId === "string") {
    await processMentoredEvaluationJob({
      ...input,
      debriefEvaluationId: input.debriefEvaluationId,
    });
    return;
  }

  const supabase = createAdminClient();
  const { evaluationId, userId, sermonTitle, manuscript, context, primaryPassage } =
    input;

  // Compare-and-swap: only one worker may move pending → running.
  // Zero rows means another worker already owns it — normal, not a failure.
  const { data: claimed, error: runningError } = await supabase
    .from("sermon_evaluations")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", evaluationId)
    .eq("status", "pending")
    .select("id");

  if (runningError) {
    throw new Error(runningError.message);
  }

  if (!claimed || claimed.length === 0) {
    return;
  }

  try {
    const { data: evaluationRow, error: fetchError } = await supabase
      .from("sermon_evaluations")
      .select("report_mode, output_language")
      .eq("id", evaluationId)
      .single();

    if (fetchError || !evaluationRow) {
      throw new Error(fetchError?.message ?? "Evaluation not found.");
    }

    const reportMode = normalizeReportMode(evaluationRow.report_mode);
    const outputLanguage = parseOutputLanguage(evaluationRow.output_language);

    const { result: scoredResult, model, inputTokens, outputTokens } =
      await runEvaluation({
        sermonTitle,
        manuscript,
        context,
        primaryPassage: primaryPassage?.trim() || undefined,
        outputLanguage,
      });

    let result = scoredResult;
    let coachingNarrative = null;
    let billedInputTokens = inputTokens;
    let billedOutputTokens = outputTokens;

    if (reportMode === "debrief") {
      const coaching = await runCoachingNarrative({
        result,
        manuscript,
        sermonTitle,
        primaryPassage,
        context,
      });
      coachingNarrative = coaching.narrative;
      billedInputTokens += coaching.inputTokens;
      billedOutputTokens += coaching.outputTokens;
    }

    const logContext = { evaluationId, userId };
    const [verdictPass, hip] = await Promise.all([
      runCriterionVerdictLinesBestEffort(result, logContext, {
        outputLanguage,
      }),
      runHowItPreachesBestEffort(
        {
          manuscript,
          sermonTitle,
          primaryPassage,
          context,
          outputLanguage,
        },
        logContext,
      ),
    ]);

    result = verdictPass.result;
    billedInputTokens += verdictPass.inputTokens + hip.inputTokens;
    billedOutputTokens += verdictPass.outputTokens + hip.outputTokens;
    const howItPreaches = hip.howItPreaches;

    const completedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("sermon_evaluations")
      .update({
        status: "complete",
        model,
        result,
        coaching_narrative: coachingNarrative,
        how_it_preaches: howItPreaches,
        overall_score: result.scoring.composite_weighted,
        score_band: formatScoreBandStrict(result.scoring),
        input_tokens: billedInputTokens,
        output_tokens: billedOutputTokens,
        completed_at: completedAt,
      })
      .eq("id", evaluationId)
      .eq("status", "running");

    if (updateError) {
      throw new Error(updateError.message);
    }

    await recordEvaluationComplete(userId);
  } catch (error) {
    await supabase
      .from("sermon_evaluations")
      .update({
        status: "failed",
        error_message: userSafeError(error),
        completed_at: new Date().toISOString(),
      })
      .eq("id", evaluationId)
      .eq("status", "running");

    throw error;
  }
}
