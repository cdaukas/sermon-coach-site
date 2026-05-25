import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  buildUserMessage,
  getEvaluationModel,
  type EvaluationUserMessageInput,
} from "./prompt";
import {
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

export async function runEvaluation(
  input: EvaluationUserMessageInput,
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

  let response: Anthropic.Messages.Message;

  try {
    response = await client.messages.create({
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

  const toolInput = extractToolInput(response.content);

  let result: EvaluationResultStrict;
  try {
    result = evaluationResultStrictSchema.parse(toolInput);
  } catch (error) {
    logSchemaFailure(toolInput, error);
    throw new EvaluationRunError(
      "Evaluation response failed schema validation.",
      "schema",
    );
  }

  return {
    result,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
