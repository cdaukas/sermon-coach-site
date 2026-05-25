import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  buildUserMessage,
  getEvaluationModel,
  type EvaluationUserMessageInput,
} from "./prompt";
import {
  parseEvaluationResultStrict,
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

async function callClaude(
  client: Anthropic,
  model: string,
  input: EvaluationUserMessageInput,
  schemaError?: string,
): Promise<Anthropic.Messages.Message> {
  const userText = schemaError
    ? `${buildUserMessage(input)}

---

**Schema repair:** Your previous tool response failed validation:
${schemaError}

Call submit_sermon_evaluation again with a corrected full JSON object.`
    : buildUserMessage(input);

  return client.messages.create({
    model,
    max_tokens: 16_000,
    system: buildSystemPrompt(),
    tools: [submitSermonEvaluationTool],
    tool_choice: { type: "tool", name: submitSermonEvaluationTool.name },
    messages: [{ role: "user", content: userText }],
  });
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
    response = await callClaude(client, model, input);
  } catch {
    throw new EvaluationRunError(
      "The evaluation service is temporarily unavailable.",
      "api",
    );
  }

  let toolInput = extractToolInput(response.content);
  let parsed = parseEvaluationResultStrict(toolInput);

  if (!parsed) {
    const firstError = "Invalid or incomplete JSON structure.";
    try {
      response = await callClaude(client, model, input, firstError);
    } catch {
      throw new EvaluationRunError(
        "The evaluation service is temporarily unavailable.",
        "api",
      );
    }
    toolInput = extractToolInput(response.content);
    parsed = parseEvaluationResultStrict(toolInput);

    if (!parsed) {
      throw new EvaluationRunError(
        "Evaluation response failed schema validation after retry.",
        "schema",
      );
    }
  }

  return {
    result: parsed,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
