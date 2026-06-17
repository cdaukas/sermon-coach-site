import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
  sumEvalUsage,
  usageFromResponse,
  type EvalUsageTotals,
} from "./eval-cost";
import { buildCoachingUserMessage, type CoachingPromptInput } from "./coaching-prompt";
import {
  coachingNarrativeSchema,
  submitCoachingNarrativeTool,
  type CoachingNarrative,
} from "./coaching-schema";
import { getEvaluationModel } from "./prompt";

export type RunCoachingNarrativeSuccess = {
  narrative: CoachingNarrative;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class CoachingNarrativeError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "api" | "schema" | "tool",
  ) {
    super(message);
    this.name = "CoachingNarrativeError";
  }
}

export type CreateCoachingMessage = (
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Messages.Message>;

export type RunCoachingNarrativeOptions = {
  createMessage?: CreateCoachingMessage;
};

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
): unknown {
  const block = content.find(
    (item) =>
      item.type === "tool_use" && item.name === submitCoachingNarrativeTool.name,
  );

  if (!block || block.type !== "tool_use") {
    throw new CoachingNarrativeError(
      "Model did not return submit_coaching_narrative tool output.",
      "tool",
    );
  }

  return block.input;
}

function logSchemaFailure(toolInput: unknown, error: unknown): void {
  console.error("[coaching] Schema validation failed for model output.");
  try {
    console.error(
      "[coaching] Raw tool input:",
      JSON.stringify(toolInput, null, 2),
    );
  } catch {
    console.error("[coaching] Raw tool input (non-serializable):", toolInput);
  }
  console.error("[coaching] Validation error:", error);
}

function parseValidatedNarrative(toolInput: unknown): CoachingNarrative {
  try {
    return coachingNarrativeSchema.parse(toolInput);
  } catch (error) {
    logSchemaFailure(toolInput, error);
    throw new CoachingNarrativeError(
      "Coaching narrative failed schema validation.",
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
  input: CoachingPromptInput,
  createMessage: CreateCoachingMessage,
): Promise<CallClaudeResult> {
  let response: Anthropic.Messages.Message;

  try {
    response = await createMessage({
      model,
      max_tokens: 8_000,
      messages: [{ role: "user", content: buildCoachingUserMessage(input) }],
      tools: [submitCoachingNarrativeTool],
      tool_choice: { type: "tool", name: submitCoachingNarrativeTool.name },
    });
  } catch {
    throw new CoachingNarrativeError(
      "The coaching narrative service is temporarily unavailable.",
      "api",
    );
  }

  return {
    model: response.model,
    usage: usageFromResponse(response.usage),
    toolInput: extractToolInput(response.content),
  };
}

export async function runCoachingNarrative(
  input: CoachingPromptInput,
  options?: RunCoachingNarrativeOptions,
): Promise<RunCoachingNarrativeSuccess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new CoachingNarrativeError(
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
      const narrative = parseValidatedNarrative(call.toolInput);
      const billedUsage = sumEvalUsage(attemptUsages);

      logEvalCost(
        buildEvalCostLogPayload({
          model: responseModel,
          usage: billedUsage,
          apiAttempts,
        }),
      );

      return {
        narrative,
        model: responseModel,
        inputTokens: call.usage.input_tokens,
        outputTokens: call.usage.output_tokens,
      };
    } catch (error) {
      if (
        attempt === 0 &&
        error instanceof CoachingNarrativeError &&
        error.code === "schema"
      ) {
        console.error(
          "[coaching] Schema validation failed; retrying once with a fresh API call.",
        );
        continue;
      }
      throw error;
    }
  }

  throw new CoachingNarrativeError(
    "Coaching narrative failed schema validation.",
    "schema",
  );
}
