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
    "Submit one-line collapsed-row verdict summaries keyed by criterion id 1–11. Full pass: all eleven. Quality repair: only the requested ids.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["lines"],
    properties: {
      lines: {
        type: "array",
        minItems: 1,
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

// ---------------------------------------------------------------------------
// Both-halves (hinge) + subject-verb agreement heuristics
// ---------------------------------------------------------------------------

/**
 * Comma-plus-conjunction hinge markers. Matched case-insensitively on the
 * normalized line (articles / spacing already collapsed).
 */
const COMMA_CONJUNCTION_HINGE =
  /,\s*(?:and|but|or|yet|though|while)\b/i;

/**
 * Standalone hinge words (not only after comma). Word-boundary match avoids
 * false hits inside words like "without".
 */
const HINGE_WORD =
  /\b(?:but|though|while|yet)\b/i;

/**
 * True when the line has a two-part structure: semicolon, hinge word
 * (but / though / while / yet), or comma-plus-conjunction
 * (, and / , but / , or / , yet / , though / , while).
 */
export function hasVerdictHinge(text: string): boolean {
  const normalized = normalizeVerdictLine(text);
  if (!normalized) return false;
  if (normalized.includes(";")) return true;
  if (COMMA_CONJUNCTION_HINGE.test(normalized)) return true;
  if (HINGE_WORD.test(normalized)) return true;
  return false;
}

/** Inverse of hasVerdictHinge — single-clause line with no half-marker. */
export function isSingleClauseVerdictLine(text: string): boolean {
  return !hasVerdictHinge(text);
}

/**
 * Common bare present-tense verbs that need -s/-es under a 3sg subject.
 * Split into high-confidence verbal stems vs dual POS (noun/verb) stems
 * that only flag with a verbal right-context cue.
 */
const CLEAR_BARE_VERBS = new Set([
  "detonate",
  "rise",
  "reshape",
  "deepen",
  "outrun",
  "collapse",
  "weaken",
  "strengthen",
  "precede",
  "follow",
  "arrive",
  "bury",
  "announce",
  "create",
  "sustain",
  "support",
  "conceal",
  "reveal",
  "fail",
  "miss",
  "earn",
  "lose",
  "carry",
  "drive",
  "speak",
  "grow",
  "fall",
  "run",
  "sit",
  "come",
  "go",
]);

/** Dual POS — only flagged with a verbal right-context cue (e.g. "land as"). */
const AMBIGUOUS_BARE_VERBS = new Set([
  "land",
  "claim",
  "frame",
  "point",
  "name",
  "mark",
  "open",
  "break",
  "work",
  "rest",
  "show",
  "press",
  "hold",
  "stand",
  "stay",
  "turn",
  "serve",
  "read",
  "signal",
  "shape",
  "ground",
  "take",
  "want",
]);

const BARE_PRESENT_VERBS = new Set([
  ...CLEAR_BARE_VERBS,
  ...AMBIGUOUS_BARE_VERBS,
]);

/** Attributive adjectives that must not be treated as NP heads. */
const COMMON_ADJECTIVES = new Set([
  "main",
  "clear",
  "full",
  "real",
  "own",
  "true",
  "false",
  "next",
  "last",
  "first",
  "second",
  "third",
  "final",
  "primary",
  "major",
  "minor",
  "central",
  "whole",
  "same",
  "other",
  "named",
  "quoted",
  "spoken",
  "written",
  "strong",
  "weak",
  "long",
  "short",
  "high",
  "low",
  "good",
  "bad",
  "new",
  "old",
  "structural",
  "argumentative",
  "exegetical",
  "textual",
  "memorable",
  "audible",
  "visible",
  "single",
  "double",
  "two",
  "three",
]);

/** Right-context tokens that make an ambiguous bare verb look finite. */
const VERBAL_RIGHT_CONTEXT = new Set([
  "as",
  "rather",
  "clearly",
  "instead",
  "without",
  "away",
  "here",
  "there",
  "hard",
  "soft",
  "into",
  "onto",
  "across",
  "before",
  "after",
  "when",
  "while",
  "though",
  "but",
  "yet",
  "and",
  "or",
]);

const COPULA_OR_AUX = new Set([
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
]);

const DETERMINERS = new Set([
  "the",
  "a",
  "an",
  "this",
  "that",
  "its",
  "their",
  "his",
  "her",
  "our",
  "my",
  "your",
  "each",
  "every",
  "any",
  "some",
  "no",
]);

/** Function words that should not count as NP head or verb. */
const SKIP_AS_NOUN_OR_VERB = new Set([
  ...DETERMINERS,
  "and",
  "or",
  "but",
  "nor",
  "yet",
  "so",
  "as",
  "than",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "from",
  "with",
  "into",
  "about",
  "not",
  "also",
  "then",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "what",
  "how",
  "if",
  "unless",
  "until",
  "because",
  "while",
  "although",
  "though",
  "whether",
  "since",
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
  "rather",
  "quite",
  "very",
  "more",
  "most",
  "less",
  "least",
  "too",
  "much",
  "such",
]);

/**
 * Likely singular common-noun head: not empty, not a closed-class word, not
 * a common attributive adjective, not a hyphenated adjective compound
 * (two-point), not ending in a typical regular plural -s (with common
 * false-plural endings treated as singular: -ss, -us, -is, -ness, -ous, -ics).
 */
export function looksSingularNoun(word: string): boolean {
  const n = word.toLowerCase().replace(/[^a-z'-]/g, "");
  if (!n || n.length < 2) return false;
  if (SKIP_AS_NOUN_OR_VERB.has(n)) return false;
  if (COMMON_ADJECTIVES.has(n)) return false;
  // Hyphenated modifiers like "two-point", "Lion-Lamb" mid-span: only allow
  // as head when the second half is a clear noun-ish token (letters only after -).
  if (n.includes("-")) {
    const parts = n.split("-");
    const last = parts[parts.length - 1] ?? "";
    if (COMMON_ADJECTIVES.has(last) || last.length <= 3) return false;
  }
  if (
    n.endsWith("s") &&
    !n.endsWith("ss") &&
    !n.endsWith("us") &&
    !n.endsWith("is") &&
    !n.endsWith("ness") &&
    !n.endsWith("ous") &&
    !n.endsWith("ics") &&
    !n.endsWith("'s")
  ) {
    return false;
  }
  return true;
}

/**
 * Heuristic: flag 3sg subject + bare present verb without agreement -s
 * (e.g. "The Lion-Lamb reversal detonate as the text's own hinge").
 *
 * Pattern: determiner + up to two modifiers + singular-looking head + bare verb.
 * Ambiguous dual-POS stems (claim/frame/land) only flag with verbal right context.
 */
export function hasSubjectVerbAgreementIssue(text: string): boolean {
  return detectSubjectVerbAgreementIssue(text) !== null;
}

const BARE_VERB_ALT = [...BARE_PRESENT_VERBS].join("|");

/** Determiner + optional modifiers + head + bare verb (case-insensitive). */
const SV_BARE_PATTERN = new RegExp(
  `\\b(?:the|a|an|this|that|its|their|his|her)\\s+(?:[A-Za-z][\\w'-]*\\s+){0,2}([A-Za-z][\\w'-]*)\\s+(${BARE_VERB_ALT})\\b`,
  "gi",
);

export function detectSubjectVerbAgreementIssue(
  text: string,
): { subject: string; verb: string } | null {
  const withoutPeriod = normalizeVerdictLine(text).replace(/\.+$/, "").trim();
  if (!withoutPeriod) return null;

  SV_BARE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SV_BARE_PATTERN.exec(withoutPeriod)) !== null) {
    const subject = match[1]!;
    const verb = match[2]!.toLowerCase();
    if (!looksSingularNoun(subject)) continue;

    const after = withoutPeriod.slice(match.index + match[0].length).trim();
    const nextWord = (after.split(/\s+/)[0] ?? "")
      .toLowerCase()
      .replace(/[^a-z'-]/g, "");

    // "the two-point frame is clear" — candidate is a noun before a copula.
    if (nextWord && COPULA_OR_AUX.has(nextWord)) continue;

    if (AMBIGUOUS_BARE_VERBS.has(verb)) {
      // Require a finite-looking complement cue or end of sentence.
      if (nextWord && !VERBAL_RIGHT_CONTEXT.has(nextWord)) continue;
    }

    return { subject, verb };
  }

  return null;
}

export type VerdictLineQualityIssueReason =
  | "missing_hinge"
  | "subject_verb_agreement";

export type VerdictLineQualityIssue = {
  id: number;
  score: number;
  reason: VerdictLineQualityIssueReason;
  detail: string;
  line: string;
};

/**
 * Collect quality invalidations: single-clause below score 5, and SV slips.
 * Score 5 is exempt from the both-halves rule only.
 */
export function collectVerdictLineQualityIssues(
  linesById: ReadonlyMap<number, string>,
  scoresById: ReadonlyMap<number, number>,
): VerdictLineQualityIssue[] {
  const issues: VerdictLineQualityIssue[] = [];

  for (const [id, line] of linesById) {
    const score = scoresById.get(id) ?? 0;

    // Hinge required for any score below 5; pure 5 may be single-clause.
    if (score < 5 && isSingleClauseVerdictLine(line)) {
      issues.push({
        id,
        score,
        reason: "missing_hinge",
        detail:
          "single-clause with no hinge (no but/though/while/yet, no semicolon, no comma-plus-conjunction)",
        line,
      });
    }

    const sv = detectSubjectVerbAgreementIssue(line);
    if (sv) {
      issues.push({
        id,
        score,
        reason: "subject_verb_agreement",
        detail: `subject-verb agreement: singular "${sv.subject}" + bare verb "${sv.verb}" (needs 3sg -s)`,
        line,
      });
    }
  }

  return issues;
}

/**
 * Parse a partial id→line map (1–11 items) for targeted quality retries.
 * Does not require full 1–11 coverage.
 */
export function validateAndMapVerdictLinesPartial(
  raw: unknown,
): Map<number, string> {
  const partialSchema = z.object({
    lines: z
      .array(criterionVerdictLineItemSchema)
      .min(1)
      .max(11),
  });
  const parsed = partialSchema.parse(raw);
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

  return byId;
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
