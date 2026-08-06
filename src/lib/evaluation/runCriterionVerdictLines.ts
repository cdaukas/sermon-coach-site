import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
  sumEvalUsage,
  usageFromResponse,
  type EvalUsageTotals,
} from "./eval-cost";
import {
  clearCriterionVerdictLines,
  mergeCriterionVerdictLines,
  type EvaluationResultStrict,
} from "./schema";
import {
  buildVerdictLineSystemPrompt,
  buildVerdictLineUserMessage,
  VERDICT_LINE_MAX_WORDS,
  VERDICT_LINE_MODEL,
  type VerdictLineCriterionInput,
} from "./verdict-line-prompt";
import {
  enforceVerdictLineWordCap,
  hasOverlongVerdictLine,
  submitCriterionVerdictLinesTool,
  validateAndMapVerdictLines,
} from "./verdict-line-schema";

export type RunCriterionVerdictLinesSuccess = {
  result: EvaluationResultStrict;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class CriterionVerdictLinesError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "api" | "schema" | "tool",
  ) {
    super(message);
    this.name = "CriterionVerdictLinesError";
  }
}

export type CreateVerdictLineMessage = (
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Messages.Message>;

export type RunCriterionVerdictLinesOptions = {
  createMessage?: CreateVerdictLineMessage;
  model?: string;
};

function flattenCriteria(
  result: EvaluationResultStrict,
): VerdictLineCriterionInput[] {
  const out: VerdictLineCriterionInput[] = [];
  for (const category of result.categories) {
    for (const c of category.criteria) {
      out.push({
        id: c.id,
        name: c.name,
        score: c.score,
        narrative: c.narrative,
        anchored_quote: c.anchored_quote ?? null,
      });
    }
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
): unknown {
  const block = content.find(
    (item) =>
      item.type === "tool_use" &&
      item.name === submitCriterionVerdictLinesTool.name,
  );

  if (!block || block.type !== "tool_use") {
    throw new CriterionVerdictLinesError(
      "Model did not return submit_criterion_verdict_lines tool output.",
      "tool",
    );
  }

  return block.input;
}

async function callHaiku(
  model: string,
  criteria: VerdictLineCriterionInput[],
  createMessage: CreateVerdictLineMessage,
  retryNote?: string,
): Promise<{ model: string; usage: EvalUsageTotals; toolInput: unknown }> {
  let response: Anthropic.Messages.Message;

  const userContent = retryNote
    ? `${buildVerdictLineUserMessage(criteria)}\n\n${retryNote}`
    : buildVerdictLineUserMessage(criteria);

  try {
    response = await createMessage({
      model,
      max_tokens: 2_000,
      system: buildVerdictLineSystemPrompt(),
      tools: [submitCriterionVerdictLinesTool],
      tool_choice: {
        type: "tool",
        name: submitCriterionVerdictLinesTool.name,
      },
      messages: [{ role: "user", content: userContent }],
    });
  } catch {
    throw new CriterionVerdictLinesError(
      "The verdict-line service is temporarily unavailable.",
      "api",
    );
  }

  return {
    model: response.model,
    usage: usageFromResponse(response.usage),
    toolInput: extractToolInput(response.content),
  };
}

/**
 * Batched Haiku pass: eleven lines from finished criterion narratives.
 * Call after runEvaluation; merge into result before the single complete write.
 *
 * Length: 12–18 words is advised in the prompt. Overlong batch → one full
 * retry with a hard-cap reminder. Then always clause-boundary cap before merge
 * (no-op when already ≤ max). Word count is not rejected on first parse alone.
 *
 * Path (always):
 *   tool → validateAndMap → [optional retry if hasOverlong] →
 *   enforceVerdictLineWordCap → mergeCriterionVerdictLines
 * Job path and backfill both call this function; there is no bypass merge.
 */
export async function runCriterionVerdictLines(
  result: EvaluationResultStrict,
  options?: RunCriterionVerdictLinesOptions,
): Promise<RunCriterionVerdictLinesSuccess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new CriterionVerdictLinesError(
      "ANTHROPIC_API_KEY is not configured.",
      "config",
    );
  }

  const model = options?.model ?? VERDICT_LINE_MODEL;
  const client = new Anthropic({ apiKey });
  const createMessage =
    options?.createMessage ??
    ((params) => client.messages.create(params));

  const criteria = flattenCriteria(result);
  if (criteria.length !== 11) {
    throw new CriterionVerdictLinesError(
      `Expected 11 criteria, got ${criteria.length}.`,
      "schema",
    );
  }

  const attemptUsages: EvalUsageTotals[] = [];
  let responseModel = model;
  let linesById: Map<number, string>;

  const first = await callHaiku(model, criteria, createMessage);
  attemptUsages.push(first.usage);
  responseModel = first.model;

  try {
    linesById = validateAndMapVerdictLines(first.toolInput);
  } catch (error) {
    console.error("[verdict-lines] Schema validation failed.", error);
    throw new CriterionVerdictLinesError(
      "Verdict-line response failed validation.",
      "schema",
    );
  }

  if (hasOverlongVerdictLine(linesById, VERDICT_LINE_MAX_WORDS)) {
    console.warn(
      `[verdict-lines] One or more lines exceeded ${VERDICT_LINE_MAX_WORDS} words; retrying once.`,
    );
    const retry = await callHaiku(
      model,
      criteria,
      createMessage,
      `RETRY: Every verdict_line must be at most ${VERDICT_LINE_MAX_WORDS} words. Shorter is better. Count words before submit.`,
    );
    attemptUsages.push(retry.usage);
    responseModel = retry.model;

    try {
      linesById = validateAndMapVerdictLines(retry.toolInput);
    } catch (error) {
      console.error("[verdict-lines] Schema validation failed on retry.", error);
      throw new CriterionVerdictLinesError(
        "Verdict-line response failed validation.",
        "schema",
      );
    }
  }

  // Hard gate: always cap before merge so overlong lines never reach storage,
  // even when retry fails to shorten. Truncate is a no-op under the ceiling.
  if (hasOverlongVerdictLine(linesById, VERDICT_LINE_MAX_WORDS)) {
    console.warn(
      `[verdict-lines] Cap still exceeded; truncating to clause boundary at ${VERDICT_LINE_MAX_WORDS} words.`,
    );
  }
  linesById = enforceVerdictLineWordCap(linesById, VERDICT_LINE_MAX_WORDS);

  const merged = mergeCriterionVerdictLines(result, linesById);
  const billedUsage = sumEvalUsage(attemptUsages);

  logEvalCost(
    buildEvalCostLogPayload({
      model: responseModel,
      usage: billedUsage,
      apiAttempts: attemptUsages.length,
    }),
  );

  return {
    result: merged,
    model: responseModel,
    inputTokens: billedUsage.input_tokens,
    outputTokens: billedUsage.output_tokens,
  };
}

export type CriterionVerdictLinesLogContext = {
  evaluationId: string;
  userId: string;
};

export type RunCriterionVerdictLinesBestEffortResult = {
  result: EvaluationResultStrict;
  inputTokens: number;
  outputTokens: number;
};

/**
 * Never fails the evaluation. On any error, write null verdict_lines and continue.
 */
export async function runCriterionVerdictLinesBestEffort(
  result: EvaluationResultStrict,
  logContext: CriterionVerdictLinesLogContext,
  options?: RunCriterionVerdictLinesOptions,
): Promise<RunCriterionVerdictLinesBestEffortResult> {
  try {
    const pass = await runCriterionVerdictLines(result, options);
    return {
      result: pass.result,
      inputTokens: pass.inputTokens,
      outputTokens: pass.outputTokens,
    };
  } catch (error) {
    console.error("[verdict-lines] Non-fatal generation failed.", {
      evaluationId: logContext.evaluationId,
      userId: logContext.userId,
      error,
    });
    return {
      result: clearCriterionVerdictLines(result),
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}
