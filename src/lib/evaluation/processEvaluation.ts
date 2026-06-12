import { createClient } from "@/lib/supabase/server";
import type { SermonContext } from "./context";
import { formatScoreBandStrict } from "./schema";
import { recordEvaluationComplete } from "./quota";
import { runEvaluation, EvaluationRunError } from "./runEvaluation";

export type ProcessEvaluationInput = {
  evaluationId: string;
  userId: string;
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
};

function userSafeError(error: unknown): string {
  if (error instanceof EvaluationRunError) {
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

export async function processEvaluationJob(
  input: ProcessEvaluationInput,
): Promise<void> {
  const supabase = await createClient();
  const { evaluationId, userId, sermonTitle, manuscript, context } = input;

  const { error: runningError } = await supabase
    .from("sermon_evaluations")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", evaluationId)
    .in("status", ["pending", "running"]);

  if (runningError) {
    throw new Error(runningError.message);
  }

  try {
    const { result, model, inputTokens, outputTokens } = await runEvaluation({
      sermonTitle,
      manuscript,
      context,
    });

    const completedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("sermon_evaluations")
      .update({
        status: "complete",
        model,
        result,
        overall_score: result.scoring.composite_weighted,
        score_band: formatScoreBandStrict(result.scoring),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
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
