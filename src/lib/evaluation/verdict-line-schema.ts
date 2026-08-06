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
 * Words that leave a truncated sentence incomplete — they require a following
 * object, complement, or clause. Shipping these dangling is worse than a long line.
 */
const INCOMPLETE_TERMINAL_WORDS = new Set([
  // Coordinating / subordinating conjunctions
  "and",
  "but",
  "or",
  "nor",
  "yet",
  "so",
  "because",
  "while",
  "although",
  "though",
  "if",
  "unless",
  "until",
  "when",
  "where",
  "whereas",
  "whether",
  "since",
  "as",
  "than",
  // Prepositions
  "of",
  "to",
  "with",
  "in",
  "on",
  "at",
  "by",
  "for",
  "from",
  "into",
  "about",
  "against",
  "between",
  "among",
  "through",
  "during",
  "without",
  "within",
  "across",
  "behind",
  "beyond",
  "under",
  "over",
  "after",
  "before",
  "around",
  "near",
  "upon",
  "toward",
  "towards",
  "via",
  "per",
  "vs",
  "versus",
  // Comparatives / degree (need an object or complement)
  "more",
  "less",
  "most",
  "least",
  "rather",
  "quite",
  "too",
  "very",
  "much",
  "such",
  // Determiners / articles
  "a",
  "an",
  "the",
  "its",
  "their",
  "his",
  "her",
  "our",
  "my",
  "your",
  "this",
  "that",
  "these",
  "those",
  "each",
  "every",
  "any",
  "some",
  "no",
  // Incomplete verb forms needing complement
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "shall",
  "should",
  "can",
  "could",
  "may",
  "might",
  "must",
  // Relative / interrogative lead-ins
  "which",
  "who",
  "whom",
  "whose",
  "what",
  "how",
  "not",
]);

/** Last content word before the terminal period (lowercased, stripped of trailing punct). */
export function terminalContentWord(text: string): string {
  const normalized = normalizeVerdictLine(text);
  const withoutPeriod = normalized.replace(/\.+$/, "").trim();
  if (!withoutPeriod) return "";
  const words = withoutPeriod.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? "";
  return last.replace(/[^a-zA-Z'-]+$/g, "").toLowerCase();
}

/**
 * True when a truncated (or model) line ends on a word that needs a following
 * object — conjunction, preposition, comparative, determiner, incomplete verb, etc.
 */
export function endsOnIncompleteGrammaticalTail(text: string): boolean {
  const last = terminalContentWord(text);
  if (!last) return true;
  return INCOMPLETE_TERMINAL_WORDS.has(last);
}

/**
 * Cut an overlong sentence at the last clause boundary that still ≤ maxWords.
 * Prefer ; : — , then word boundary. Always keeps a final period.
 *
 * Returns null when no complete sentence can be formed within the cap (e.g.
 * every candidate ends on "than", "but", "of", "to", "with"). Callers must
 * fall back to the uncapped attempt rather than ship a broken sentence.
 */
export function truncateVerdictLineToMaxWords(
  text: string,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): string | null {
  const normalized = normalizeVerdictLine(text);
  if (!normalized) return normalized;
  if (countWords(normalized) <= maxWords) {
    // Already under cap — still reject incomplete tails (shouldn't happen on model output often).
    if (endsOnIncompleteGrammaticalTail(normalized)) return null;
    return normalized;
  }

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
        const candidate = normalizeVerdictLine(before);
        if (!endsOnIncompleteGrammaticalTail(candidate)) {
          return candidate;
        }
      }
    }
  }

  // No usable clause mark — hard word cap at longest complete (non-dangling) prefix.
  for (let end = maxWords; end >= Math.min(8, maxWords); end--) {
    const candidate = normalizeVerdictLine(words.slice(0, end).join(" "));
    if (!endsOnIncompleteGrammaticalTail(candidate)) {
      return candidate;
    }
  }

  // Every candidate dangles (e.g. ends on "than") — refuse rather than break.
  return null;
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

export type EnforceVerdictLineWordCapResult = {
  lines: Map<number, string>;
  /** Lines kept overlong because every safe truncate ended incomplete. */
  rejectedBrokenTruncate: Array<{
    id: number;
    wordCount: number;
    lastWord: string;
    attemptPreview: string;
  }>;
};

/**
 * Cap every overlong line at a clause boundary (post-retry fallthrough).
 * When truncation would end mid-grammatical-tail, keep the uncapped attempt
 * and record it for logging — never ship "…less clearly than."
 */
export function enforceVerdictLineWordCap(
  linesById: ReadonlyMap<number, string>,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): EnforceVerdictLineWordCapResult {
  const out = new Map<number, string>();
  const rejectedBrokenTruncate: EnforceVerdictLineWordCapResult["rejectedBrokenTruncate"] =
    [];

  for (const [id, line] of linesById) {
    if (countWords(line) <= maxWords) {
      out.set(id, line);
      continue;
    }

    const truncated = truncateVerdictLineToMaxWords(line, maxWords);
    if (truncated !== null && countWords(truncated) <= maxWords) {
      out.set(id, truncated);
      continue;
    }

    // Incomplete truncate or no candidate — keep uncapped attempt.
    rejectedBrokenTruncate.push({
      id,
      wordCount: countWords(line),
      lastWord: terminalContentWord(line),
      attemptPreview: line.length > 120 ? `${line.slice(0, 117)}...` : line,
    });
    out.set(id, line);
  }

  return { lines: out, rejectedBrokenTruncate };
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
