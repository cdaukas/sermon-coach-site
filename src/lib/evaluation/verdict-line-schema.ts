import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";
import {
  VERDICT_LINE_MAX_WORDS,
  VERDICT_LINE_MIN_WORDS,
} from "./verdict-line-prompt";

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
              description: `One complete sentence, ${VERDICT_LINE_MIN_WORDS}–${VERDICT_LINE_MAX_WORDS} words, ending with a period; takeaway not opening paraphrase; hinge grammar; no em-dash; no restated score.`,
            },
          },
        },
      },
    },
  },
};

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Normalize whitespace and ensure a single terminal period. */
export function normalizeVerdictLine(raw: string): string {
  let cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  cleaned = cleaned.replace(/\.+$/, ".");
  if (!cleaned.endsWith(".")) {
    cleaned = `${cleaned}.`;
  }
  return cleaned;
}

/**
 * Cut an overlong sentence at the last clause boundary that still ≤ maxWords.
 * Prefer ; : — , then word boundary. Always keeps a final period.
 */
export function truncateVerdictLineToMaxWords(
  text: string,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): string {
  const normalized = normalizeVerdictLine(text);
  if (!normalized) return normalized;
  if (countWords(normalized) <= maxWords) return normalized;

  const withoutPeriod = normalized.replace(/\.+$/, "");
  const words = withoutPeriod.split(/\s+/);

  // Walk back for clause punctuation inside a ≤maxWords prefix.
  for (let end = maxWords; end >= Math.min(8, maxWords); end--) {
    const slice = words.slice(0, end).join(" ");
    // Prefer ending the slice at a clause mark so the cut is not mid-phrase.
    const lastClause = Math.max(
      slice.lastIndexOf(";"),
      slice.lastIndexOf(":"),
      slice.lastIndexOf(","),
    );
    if (lastClause >= 0) {
      const before = slice.slice(0, lastClause).trim();
      if (countWords(before) >= 8) {
        return normalizeVerdictLine(before);
      }
    }
  }

  // No usable clause mark — hard word cap, no mid-token cut.
  return normalizeVerdictLine(words.slice(0, maxWords).join(" "));
}

export function hasOverlongVerdictLine(
  linesById: ReadonlyMap<number, string>,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): boolean {
  for (const line of linesById.values()) {
    if (countWords(line) > maxWords) return true;
  }
  return false;
}

/** Cap every overlong line at a clause boundary (post-retry fallthrough). */
export function enforceVerdictLineWordCap(
  linesById: ReadonlyMap<number, string>,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): Map<number, string> {
  const out = new Map<number, string>();
  for (const [id, line] of linesById) {
    out.set(id, truncateVerdictLineToMaxWords(line, maxWords));
  }
  return out;
}

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
    const cleaned = normalizeVerdictLine(item.verdict_line);
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
