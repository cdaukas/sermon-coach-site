/**
 * One Anthropic tool call per prep card: rewrite each focus WAS quote.
 * Injects the shared rewrite register. May only rewrite the quoted ask.
 */

import Anthropic from "@anthropic-ai/sdk";
import { loadRewriteRegisterMarkdown } from "@/lib/evaluation/prompt";
import {
  computeEvalCostUsd,
  usageFromResponse,
  type EvalUsageTotals,
} from "@/lib/evaluation/eval-cost";
import type { PrepFailureExample } from "./select-failure-examples";
import type { PrepMeasureId } from "./measures";

export type PrepFocusRewrite = {
  measureId: PrepMeasureId;
  rewrite: string;
};

export type PrepRewriteResult = {
  rewrites: PrepFocusRewrite[];
  usage: EvalUsageTotals | null;
  model: string;
  estimatedCostUsd: number | null;
};

const TOOL: Anthropic.Tool = {
  name: "submit_prep_card_rewrites",
  description:
    "Rewrites of the preacher's own asks for the prep card. One rewrite per input item.",
  input_schema: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["measure_id", "rewrite"],
          properties: {
            measure_id: { type: "number" },
            rewrite: { type: "string" },
          },
        },
      },
    },
  },
};

function buildUserPrompt(examples: PrepFailureExample[]): string {
  const blocks = examples.map((example, index) => {
    return (
      `### Item ${index + 1}\n` +
      `measure_id: ${example.measureId}\n` +
      `sermon_title: ${example.sermonTitle}\n` +
      `ORIGINAL (rewrite only this text):\n${example.quote}`
    );
  });
  return (
    "Rewrite each ORIGINAL below for the preacher's next Saturday.\n" +
    "Rules:\n" +
    "- Rewrite only the quoted ask or excerpt. Do not assert anything about the sermon as a whole.\n" +
    "- Do not add facts the quote does not support.\n" +
    "- Do not produce counts, tallies, or percentages.\n" +
    "- Return one items[] row per measure_id you were given.\n" +
    "- Follow the rewrite register.\n\n" +
    blocks.join("\n\n")
  );
}

function extractToolInput(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (
      block.type === "tool_use" &&
      block.name === "submit_prep_card_rewrites"
    ) {
      return block.input;
    }
  }
  throw new Error("Model did not return submit_prep_card_rewrites.");
}

/**
 * One call for the whole card. Empty examples → empty result, no API call.
 */
export async function rewriteFocusExamples(
  examples: PrepFailureExample[],
  options?: { apiKey?: string; model?: string },
): Promise<PrepRewriteResult> {
  if (examples.length === 0) {
    return {
      rewrites: [],
      usage: null,
      model: "",
      estimatedCostUsd: null,
    };
  }

  const apiKey =
    options?.apiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const model =
    options?.model?.trim() ||
    process.env.EVALUATION_MODEL?.trim() ||
    "claude-sonnet-4-6";

  const client = new Anthropic({ apiKey });
  const system =
    "You rewrite pulpit speech for The Sermon Coach prep card.\n\n" +
    loadRewriteRegisterMarkdown();

  const message = await client.messages.create({
    model,
    max_tokens: 4000,
    system,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: buildUserPrompt(examples) }],
  });

  const usage = usageFromResponse(message.usage);
  const estimatedCostUsd = computeEvalCostUsd(model, usage);

  const input = extractToolInput(message) as {
    items?: Array<{ measure_id?: number; rewrite?: string }>;
  };
  const wanted = new Set(examples.map((e) => e.measureId));
  const rewrites: PrepFocusRewrite[] = [];
  for (const item of input.items ?? []) {
    const id = item.measure_id;
    const rewrite = item.rewrite;
    if (typeof id !== "number" || typeof rewrite !== "string") {
      continue;
    }
    if (!wanted.has(id as PrepMeasureId)) {
      continue;
    }
    const trimmed = rewrite.trim();
    if (!trimmed) {
      continue;
    }
    rewrites.push({ measureId: id as PrepMeasureId, rewrite: trimmed });
  }

  return {
    rewrites,
    usage,
    model,
    estimatedCostUsd,
  };
}
