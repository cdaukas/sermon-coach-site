import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
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
  VERDICT_LINE_MODEL,
  type VerdictLineCriterionInput,
} from "./verdict-line-prompt";
import {
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
): Promise<{ model: string; usage: EvalUsageTotals; toolInput: unknown }> {
  let response: Anthropic.Messages.Message;

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
      messages: [
        { role: "user", content: buildVerdictLineUserMessage(criteria) },
      ],
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

  const call = await callHaiku(model, criteria, createMessage);

  let linesById: Map<number, string>;
  try {
    linesById = validateAndMapVerdictLines(call.toolInput);
  } catch (error) {
    console.error("[verdict-lines] Schema validation failed.", error);
    throw new CriterionVerdictLinesError(
      "Verdict-line response failed validation.",
      "schema",
    );
  }

  const merged = mergeCriterionVerdictLines(result, linesById);

  logEvalCost(
    buildEvalCostLogPayload({
      model: call.model,
      usage: call.usage,
      apiAttempts: 1,
    }),
  );

  return {
    result: merged,
    model: call.model,
    inputTokens: call.usage.input_tokens,
    outputTokens: call.usage.output_tokens,
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
