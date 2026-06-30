import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
  sumEvalUsage,
  usageFromResponse,
  type EvalUsageTotals,
} from "./eval-cost";
import {
  buildHowItPreachesUserMessage,
  type HowItPreachesPromptInput,
} from "./hip-prompt";
import {
  howItPreachesSchema,
  submitHowItPreachesTool,
  validateHowItPreachesMovements,
  type HowItPreaches,
} from "./hip-schema";
import { getEvaluationModel } from "./prompt";

export type RunHowItPreachesSuccess = {
  howItPreaches: HowItPreaches;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class HowItPreachesError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "api" | "schema" | "tool",
  ) {
    super(message);
    this.name = "HowItPreachesError";
  }
}

export type CreateHowItPreachesMessage = (
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Messages.Message>;

export type RunHowItPreachesOptions = {
  createMessage?: CreateHowItPreachesMessage;
};

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
): unknown {
  const block = content.find(
    (item) =>
      item.type === "tool_use" && item.name === submitHowItPreachesTool.name,
  );

  if (!block || block.type !== "tool_use") {
    throw new HowItPreachesError(
      "Model did not return submit_how_it_preaches tool output.",
      "tool",
    );
  }

  return block.input;
}

function logSchemaFailure(toolInput: unknown, error: unknown): void {
  console.error("[how-it-preaches] Schema validation failed for model output.");
  try {
    console.error(
      "[how-it-preaches] Raw tool input:",
      JSON.stringify(toolInput, null, 2),
    );
  } catch {
    console.error("[how-it-preaches] Raw tool input (non-serializable):", toolInput);
  }
  console.error("[how-it-preaches] Validation error:", error);
}

function parseValidatedHowItPreaches(toolInput: unknown): HowItPreaches {
  try {
    const parsed = howItPreachesSchema.parse(toolInput);
    return validateHowItPreachesMovements(parsed);
  } catch (error) {
    logSchemaFailure(toolInput, error);
    throw new HowItPreachesError(
      "How It Preaches response failed schema validation.",
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
  input: HowItPreachesPromptInput,
  createMessage: CreateHowItPreachesMessage,
): Promise<CallClaudeResult> {
  let response: Anthropic.Messages.Message;

  try {
    response = await createMessage({
      model,
      max_tokens: 4_000,
      messages: [{ role: "user", content: buildHowItPreachesUserMessage(input) }],
      tools: [submitHowItPreachesTool],
      tool_choice: { type: "tool", name: submitHowItPreachesTool.name },
    });
  } catch {
    throw new HowItPreachesError(
      "The How It Preaches service is temporarily unavailable.",
      "api",
    );
  }

  return {
    model: response.model,
    usage: usageFromResponse(response.usage),
    toolInput: extractToolInput(response.content),
  };
}

export async function runHowItPreaches(
  input: HowItPreachesPromptInput,
  options?: RunHowItPreachesOptions,
): Promise<RunHowItPreachesSuccess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new HowItPreachesError(
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
      const howItPreaches = parseValidatedHowItPreaches(call.toolInput);
      const billedUsage = sumEvalUsage(attemptUsages);

      logEvalCost(
        buildEvalCostLogPayload({
          model: responseModel,
          usage: billedUsage,
          apiAttempts,
        }),
      );

      return {
        howItPreaches,
        model: responseModel,
        inputTokens: call.usage.input_tokens,
        outputTokens: call.usage.output_tokens,
      };
    } catch (error) {
      if (
        attempt === 0 &&
        error instanceof HowItPreachesError &&
        error.code === "schema"
      ) {
        console.error(
          "[how-it-preaches] Schema validation failed; retrying once with a fresh API call.",
        );
        continue;
      }
      throw error;
    }
  }

  throw new HowItPreachesError(
    "How It Preaches response failed schema validation.",
    "schema",
  );
}
