import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
  sumEvalUsage,
  usageFromResponse,
  type EvalUsageTotals,
} from "./eval-cost";
import {
  buildSystemPrompt,
  buildUserMessage,
  getEvaluationModel,
  type EvaluationUserMessageInput,
} from "./prompt";
import {
  applyComputedScoring,
  evaluationResultStrictBaseSchema,
  evaluationResultStrictSchema,
  type EvaluationResultStrict,
} from "./schema";
import { submitSermonEvaluationTool } from "./tool-schema";

export type RunEvaluationSuccess = {
  result: EvaluationResultStrict;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class EvaluationRunError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "api" | "schema" | "tool",
  ) {
    super(message);
    this.name = "EvaluationRunError";
  }
}

export type CreateEvaluationMessage = (
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Messages.Message>;

export type RunEvaluationOptions = {
  /**
   * Test hook: replaces Anthropic messages.create.
   * Each schema retry invokes this again (fresh generate, not re-validation).
   */
  createMessage?: CreateEvaluationMessage;
};

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
): unknown {
  const block = content.find(
    (item) =>
      item.type === "tool_use" && item.name === submitSermonEvaluationTool.name,
  );

  if (!block || block.type !== "tool_use") {
    throw new EvaluationRunError(
      "Model did not return submit_sermon_evaluation tool output.",
      "tool",
    );
  }

  return block.input;
}

function logSchemaFailure(toolInput: unknown, error: unknown): void {
  console.error("[evaluation] Schema validation failed for model output.");
  try {
    console.error(
      "[evaluation] Raw tool input:",
      JSON.stringify(toolInput, null, 2),
    );
  } catch {
    console.error("[evaluation] Raw tool input (non-serializable):", toolInput);
  }
  console.error("[evaluation] Validation error:", error);
}

function parseValidatedResult(toolInput: unknown): EvaluationResultStrict {
  try {
    const draft = evaluationResultStrictBaseSchema.parse(toolInput);
    return evaluationResultStrictSchema.parse(applyComputedScoring(draft));
  } catch (error) {
    logSchemaFailure(toolInput, error);
    throw new EvaluationRunError(
      "Evaluation response failed schema validation.",
      "schema",
    );
  }
}

type CallClaudeResult = {
  model: string;
  usage: EvalUsageTotals;
  toolInput: unknown;
};

async function callClaude(
  model: string,
  input: EvaluationUserMessageInput,
  createMessage: CreateEvaluationMessage,
): Promise<CallClaudeResult> {
  let response: Anthropic.Messages.Message;

  try {
    response = await createMessage({
      model,
      max_tokens: 16_000,
      system: buildSystemPrompt(),
      tools: [submitSermonEvaluationTool],
      tool_choice: { type: "tool", name: submitSermonEvaluationTool.name },
      messages: [{ role: "user", content: buildUserMessage(input) }],
    });
  } catch {
    throw new EvaluationRunError(
      "The evaluation service is temporarily unavailable.",
      "api",
    );
  }

  return {
    model: response.model,
    usage: usageFromResponse(response.usage),
    toolInput: extractToolInput(response.content),
  };
}

export async function runEvaluation(
  input: EvaluationUserMessageInput,
  options?: RunEvaluationOptions,
): Promise<RunEvaluationSuccess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new EvaluationRunError(
      "ANTHROPIC_API_KEY is not configured.",
      "config",
    );
  }

  const model = getEvaluationModel();
  const client = new Anthropic({ apiKey });
  const createMessage =
    options?.createMessage ??
    ((params) => client.messages.create(params));

  const attemptUsages: EvalUsageTotals[] = [];
  let apiAttempts = 0;
  let responseModel = model;

  for (let attempt = 0; attempt < 2; attempt++) {
    const call = await callClaude(model, input, createMessage);
    apiAttempts += 1;
    attemptUsages.push(call.usage);
    responseModel = call.model;

    try {
      const result = parseValidatedResult(call.toolInput);
      const billedUsage = sumEvalUsage(attemptUsages);

      logEvalCost(
        buildEvalCostLogPayload({
          model: responseModel,
          usage: billedUsage,
          apiAttempts,
        }),
      );

      return {
        result,
        model: responseModel,
        inputTokens: call.usage.input_tokens,
        outputTokens: call.usage.output_tokens,
      };
    } catch (error) {
      if (
        attempt === 0 &&
        error instanceof EvaluationRunError &&
        error.code === "schema"
      ) {
        console.error(
          "[evaluation] Schema validation failed; retrying once with a fresh API call.",
        );
        continue;
      }
      throw error;
    }
  }

  throw new EvaluationRunError(
    "Evaluation response failed schema validation.",
    "schema",
  );
}
