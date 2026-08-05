import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

export const criterionVerdictLineItemSchema = z.object({
  id: z.number().int().min(1).max(11),
  verdict_line: z.string().min(1),
});

export const criterionVerdictLinesResultSchema = z.object({
  lines: z.array(criterionVerdictLineItemSchema).length(11),
});

export type CriterionVerdictLinesResult = z.infer<
  typeof criterionVerdictLinesResultSchema
>;

export const submitCriterionVerdictLinesTool: Tool = {
  name: "submit_criterion_verdict_lines",
  description:
    "Submit exactly eleven one-line collapsed-row verdict summaries, one per criterion id 1–11.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["lines"],
    properties: {
      lines: {
        type: "array",
        minItems: 11,
        maxItems: 11,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "verdict_line"],
          properties: {
            id: { type: "integer", minimum: 1, maximum: 11 },
            verdict_line: {
              type: "string",
              description:
                "Fragment, target 8–12 words (14 hard max), hinge grammar, elision only between clauses, no terminal period, no em-dash.",
            },
          },
        },
      },
    },
  },
};

/** Validate count, unique ids, full 1–11 coverage. Returns Map id → line or throws. */
export function validateAndMapVerdictLines(
  raw: unknown,
): Map<number, string> {
  const parsed = criterionVerdictLinesResultSchema.parse(raw);
  const byId = new Map<number, string>();

  for (const item of parsed.lines) {
    if (byId.has(item.id)) {
      throw new Error(`Duplicate verdict_line id ${item.id}`);
    }
    const cleaned = item.verdict_line.trim().replace(/\.$/, "");
    if (!cleaned) {
      throw new Error(`Empty verdict_line for id ${item.id}`);
    }
    byId.set(item.id, cleaned);
  }

  for (let id = 1; id <= 11; id++) {
    if (!byId.has(id)) {
      throw new Error(`Missing verdict_line for criterion id ${id}`);
    }
  }

  return byId;
}
