/**
 * Christ-theme focus rewrites. One call per report.
 * Markers: cross_object (C3), gospel_point (C4), outsider_address (C5).
 */

import Anthropic from "@anthropic-ai/sdk";
import { loadRewriteRegisterMarkdown } from "@/lib/evaluation/prompt";
import {
  computeEvalCostUsd,
  usageFromResponse,
} from "@/lib/evaluation/eval-cost";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import type { PrepRewriteResult } from "@/lib/prep-card/rewrite-focus";

export type ChristRewriteMarker =
  | "cross_object"
  | "gospel_point"
  | "outsider_address";

export type ChristFailureExample = {
  measureId: PrepMeasureId;
  sermonId: string;
  sermonTitle: string;
  quote: string;
  offset: number;
  marker: ChristRewriteMarker;
};

const TOOL: Anthropic.Tool = {
  name: "submit_christ_theme_rewrites",
  description:
    "Rewrites for the Christ-theme report. One rewrite per input item.",
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

const MARKER_RULES: Record<
  ChristRewriteMarker,
  { constraint: string; example: string | null }
> = {
  cross_object: {
    constraint:
      "The rewrite must name a specific thing the cross defeated, absorbed, purchased, or broke. " +
      "A warmer 'for our sins' with no content inside the phrase is wrong.",
    example:
      'ORIGINAL: "He died for our sins."\n' +
      'WRONG: "He died for all the sins we have ever committed."\n' +
      'RIGHT: "He absorbed the wrath that was aimed at you, and there is none left over."',
  },
  gospel_point: {
    constraint:
      "The rewrite must put a gospel word inside the numbered point head. " +
      "A clearer topic head with no gospel word is wrong.",
    example:
      'ORIGINAL: "2. Living in freedom"\n' +
      'WRONG: "2. Living in true freedom"\n' +
      'RIGHT: "2. Freedom Christ bought, not freedom you earned"',
  },
  outsider_address: {
    constraint:
      "The rewrite must address the person who does not yet believe and give him something to do. " +
      "Describing his danger with no verb for him is wrong.",
    example: null,
  },
};

function markerBlock(marker: ChristRewriteMarker): string {
  const rule = MARKER_RULES[marker];
  let block =
    `marker: ${marker}\n` +
    `MARKER CONSTRAINT (required): ${rule.constraint}\n` +
    `If the rewrite does not satisfy this marker, it is wrong.`;
  if (rule.example) {
    block += `\nWorked example for ${marker}:\n${rule.example}`;
  }
  return block;
}

function buildUserPrompt(examples: ChristFailureExample[]): string {
  const items = examples
    .map(
      (ex, i) =>
        `ITEM ${i + 1}\n` +
        `measure_id: ${ex.measureId}\n` +
        `sermon: ${ex.sermonTitle}\n` +
        `${markerBlock(ex.marker)}\n` +
        `ORIGINAL:\n${ex.quote}`,
    )
    .join("\n\n");
  return (
    "Rewrite each ORIGINAL only. Fix the failed marker. Do not improve the prose for its own sake.\n\n" +
    items
  );
}

function extractToolInput(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (
      block.type === "tool_use" &&
      block.name === "submit_christ_theme_rewrites"
    ) {
      return block.input;
    }
  }
  throw new Error("Model did not return submit_christ_theme_rewrites.");
}

export async function rewriteChristFocusExamples(
  examples: ChristFailureExample[],
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

  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Christ-theme rewrites.");
  }
  const model =
    options?.model ?? process.env.EVALUATION_MODEL ?? "claude-sonnet-4-6";
  const client = new Anthropic({ apiKey });
  const register = await loadRewriteRegisterMarkdown();

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system:
      "You rewrite pulpit speech for The Sermon Coach Christ-theme report.\n" +
      "You may only rewrite the quoted span. Fix the failed marker.\n\n" +
      register,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "submit_christ_theme_rewrites" },
    messages: [{ role: "user", content: buildUserPrompt(examples) }],
  });

  const input = extractToolInput(message);
  const rewrites: Array<{ measureId: PrepMeasureId; rewrite: string }> = [];
  if (
    typeof input === "object" &&
    input != null &&
    Array.isArray((input as { items?: unknown }).items)
  ) {
    for (const item of (input as { items: unknown[] }).items) {
      if (
        typeof item !== "object" ||
        item == null ||
        typeof (item as { measure_id?: unknown }).measure_id !== "number" ||
        typeof (item as { rewrite?: unknown }).rewrite !== "string"
      ) {
        continue;
      }
      const rewrite = (item as { rewrite: string }).rewrite.trim();
      if (!rewrite) {
        continue;
      }
      rewrites.push({
        measureId: (item as { measure_id: number }).measure_id as PrepMeasureId,
        rewrite,
      });
    }
  }

  const usage = usageFromResponse(message.usage);
  return {
    rewrites,
    usage,
    model,
    estimatedCostUsd: computeEvalCostUsd(model, usage),
  };
}
