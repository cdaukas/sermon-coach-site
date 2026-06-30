import { createClient } from "@/lib/supabase/server";
import type { SermonContext } from "./context";
import { isHowItPreachesEnabled } from "./feature-flags";
import {
  CoachingNarrativeError,
  runCoachingNarrative,
} from "./runCoachingNarrative";
import { HowItPreachesError, runHowItPreaches } from "./runHowItPreaches";
import { formatScoreBandStrict } from "./schema";
import { recordEvaluationComplete } from "./quota";
import { runEvaluation, EvaluationRunError } from "./runEvaluation";
import type { ReportMode } from "./types";

export type ProcessEvaluationInput = {
  evaluationId: string;
  userId: string;
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
  primaryPassage?: string | null;
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

  if (error instanceof HowItPreachesError) {
    if (error.code === "schema" || error.code === "tool") {
      return "We couldn't generate a valid How It Preaches read. Please try again.";
    }
    return "The How It Preaches service is temporarily unavailable. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong running the evaluation.";
}

export async function processEvaluationJob(
  input: ProcessEvaluationInput,
): Promise<void> {
  const supabase = await createClient();
  const { evaluationId, userId, sermonTitle, manuscript, context, primaryPassage } =
    input;

  const { error: runningError } = await supabase
    .from("sermon_evaluations")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", evaluationId)
    .in("status", ["pending", "running"]);

  if (runningError) {
    throw new Error(runningError.message);
  }

  try {
    const { data: evaluationRow, error: fetchError } = await supabase
      .from("sermon_evaluations")
      .select("report_mode")
      .eq("id", evaluationId)
      .single();

    if (fetchError || !evaluationRow) {
      throw new Error(fetchError?.message ?? "Evaluation not found.");
    }

    const reportMode = evaluationRow.report_mode as ReportMode;

    const { result, model, inputTokens, outputTokens } = await runEvaluation({
      sermonTitle,
      manuscript,
      context,
      primaryPassage: primaryPassage?.trim() || undefined,
    });

    let coachingNarrative = null;
    let billedInputTokens = inputTokens;
    let billedOutputTokens = outputTokens;

    if (reportMode === "coaching") {
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

    let howItPreaches = null;

    if (isHowItPreachesEnabled(userId)) {
      const hip = await runHowItPreaches({
        manuscript,
        sermonTitle,
        primaryPassage,
        context,
      });
      howItPreaches = hip.howItPreaches;
      billedInputTokens += hip.inputTokens;
      billedOutputTokens += hip.outputTokens;
    }

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
      .eq("id", evaluationId);

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
      .eq("id", evaluationId);

    throw error;
  }
}
