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
              description: `One complete sentence, ${VERDICT_LINE_MIN_WORDS} to ${VERDICT_LINE_MAX_WORDS} words, ending with a period; takeaway not opening paraphrase; subject-verb agreement; no em-dash or en-dash; no restated score.`,
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
 * Words that leave a sentence incomplete — they require a following object,
 * complement, or clause. Used to flag dangling model output for quality retry.
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
  "one",
  "two",
  "three",
  // Incomplete verb forms needing complement (aux / modal + bare transitive)
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
  "become",
  "becomes",
  "became",
  "go",
  "goes",
  "went",
  "get",
  "gets",
  "got",
  "make",
  "makes",
  "made",
  "take",
  "takes",
  "took",
  "give",
  "gives",
  "gave",
  "keep",
  "keeps",
  "kept",
  "leave",
  "leaves",
  "left",
  "put",
  "puts",
  "bring",
  "brings",
  "brought",
  "stay",
  "stays",
  "stayed",
  "remain",
  "remains",
  "remained",
  "seem",
  "seems",
  "seemed",
  "appear",
  "appears",
  "appeared",
  "need",
  "needs",
  "needed",
  "want",
  "wants",
  "wanted",
  "try",
  "tries",
  "tried",
  "begin",
  "begins",
  "began",
  "start",
  "starts",
  "started",
  "continue",
  "continues",
  "continued",
  "allow",
  "allows",
  "allowed",
  "require",
  "requires",
  "required",
  "include",
  "includes",
  "included",
  "portray",
  "portrays",
  "portraying",
  "defuse",
  "defuses",
  "defusing",
  // Relative / interrogative lead-ins
  "which",
  "who",
  "whom",
  "whose",
  "what",
  "how",
  "not",
]);

/** Prepositions used for "adjective after prep" incomplete detection. */
const TERMINAL_PREPOSITIONS = new Set([
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
  "as",
  "than",
]);

/**
 * -ing forms that are finite sentence endings as nouns (not dangling gerunds).
 */
const ING_NOUN_EXCEPTIONS = new Set([
  "nothing",
  "something",
  "everything",
  "anything",
  "morning",
  "evening",
  "preaching",
  "teaching",
  "meaning",
  "opening",
  "closing",
  "hearing",
  "feeling",
  "meeting",
  "reading",
  "writing",
  "building",
  "understanding",
  "beginning",
  "ending",
  "warning",
  "blessing",
  "calling",
]);

/**
 * -ly forms that are not manner/sentence adverbs (or are finite enough as ends).
 */
const LY_NON_ADVERB_EXCEPTIONS = new Set([
  "only",
  "family",
  "assembly",
  "reply",
  "supply",
  "apply",
  "rely",
  "multiply",
  "early",
  "holy",
  "silly",
  "ugly",
  "friendly",
  "lonely",
  "likely",
]);

/**
 * Attributive adjectives / participles that need a following noun when they
 * end a line mid-NP (e.g. "one actual.", "one sustained.").
 */
const ATTRIBUTIVE_TERMINAL_ADJECTIVES = new Set([
  "actual",
  "real",
  "concrete",
  "specific",
  "particular",
  "certain",
  "single",
  "double",
  "full",
  "main",
  "primary",
  "central",
  "major",
  "minor",
  "whole",
  "same",
  "other",
  "own",
  "true",
  "false",
  "new",
  "old",
  "next",
  "last",
  "first",
  "final",
  "strong",
  "weak",
  "long",
  "short",
  "high",
  "low",
  "good",
  "bad",
  "clear",
  "structural",
  "argumentative",
  "exegetical",
  "textual",
  "spiritual",
  "gospel",
  "biblical",
  "theological",
  "sustained",
  "named",
  "quoted",
  "spoken",
  "written",
  "buried",
  "hidden",
  "open",
  "closed",
  "shared",
  "stated",
  "asserted",
  "implied",
  "required",
  "needed",
  "given",
  "taken",
  "made",
  "done",
  "left",
  "kept",
  "held",
  "shown",
  "missed",
  "earned",
  "lost",
  "gained",
]);

/** Determiners / quantifiers that leave a following adjective incomplete. */
const TERMINAL_DETERMINERS = new Set([
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
  "one",
  "two",
  "three",
  "four",
  "five",
  "many",
  "few",
  "several",
  "both",
  "another",
  "such",
]);

const COPULA_TERMINALS = new Set([
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "seems",
  "seem",
  "appears",
  "appear",
  "feels",
  "feel",
  "looks",
  "look",
  "remains",
  "remain",
  "stays",
  "stay",
]);

/** Strip trailing non-letter punctuation and lowercase a token. */
function normalizeTerminalToken(raw: string): string {
  return raw.replace(/[^a-zA-Z'-]+$/g, "").toLowerCase();
}

function looksLikeLyAdverb(word: string): boolean {
  if (word.length < 4 || !word.endsWith("ly")) return false;
  if (LY_NON_ADVERB_EXCEPTIONS.has(word)) return false;
  return true;
}

function looksLikeGerundOrPresentParticiple(word: string): boolean {
  if (word.length < 5 || !word.endsWith("ing")) return false;
  if (ING_NOUN_EXCEPTIONS.has(word)) return false;
  // "thing" already covered; reject stringing-style participle tails.
  return true;
}

const NON_COMPARATIVE_ER = new Set([
  "rather",
  "after",
  "never",
  "other",
  "under",
  "over",
  "proper",
  "power",
  "paper",
  "order",
  "number",
  "matter",
  "master",
  "leader",
  "reader",
  "speaker",
  "preacher",
  "teacher",
  "hearer",
  "worker",
  "answer",
  "chapter",
  "center",
  "centre",
  "wonder",
  "timber",
  "finger",
  "member",
  "danger",
  "anger",
  "eager",
  "bitter",
  "latter",
  "former",
  "upper",
  "inner",
  "outer",
  "either",
  "neither",
  "whether",
  "together",
  "further",
  "father",
  "mother",
  "brother",
  "sister",
  "water",
  "corner",
  "cover",
  "enter",
  "offer",
  "suffer",
  "deliver",
  "recover",
  "remember",
  "consider",
  "however",
  "wherever",
  "whenever",
  "whatever",
  "whoever",
]);

const NON_SUPERLATIVE_EST = new Set([
  "honest",
  "forest",
  "arrest",
  "contest",
  "protest",
  "interest",
  "harvest",
  "request",
  "suggest",
  "manifest",
]);

function looksLikeComparativeOrSuperlative(word: string): boolean {
  if (word === "better" || word === "worse" || word === "best" || word === "worst") {
    return true;
  }
  // "-er" comparatives that need a than-clause or object ("clearer", "deeper").
  if (word.length >= 5 && word.endsWith("er") && !NON_COMPARATIVE_ER.has(word)) {
    return true;
  }
  if (word.length >= 6 && word.endsWith("est") && !NON_SUPERLATIVE_EST.has(word)) {
    return true;
  }
  return false;
}

function looksLikePastParticipleForm(word: string): boolean {
  if (
    word === "shown" ||
    word === "given" ||
    word === "taken" ||
    word === "made" ||
    word === "done" ||
    word === "left" ||
    word === "kept" ||
    word === "held" ||
    word === "seen" ||
    word === "been"
  ) {
    return true;
  }
  return (
    (word.length >= 5 && word.endsWith("ed")) ||
    (word.length >= 5 && word.endsWith("en")) ||
    (word.length >= 4 && word.endsWith("wn"))
  );
}

function looksLikeAttributiveAdjective(word: string): boolean {
  if (ATTRIBUTIVE_TERMINAL_ADJECTIVES.has(word)) return true;
  // Adjective morphology when left mid-NP ("spiritual" without -ly path).
  return /(?:ual|ive|ous|ical|able|ible|ary|ory|ent|ant)$/.test(word);
}

/**
 * Prep + complement that already finishes a phrase ("in full.", "at all.").
 * These must not flag as mid-NP adjective incompletes.
 */
const COMPLETE_PREPOSITIONAL_COMPLEMENTS = new Set([
  "full",
  "all",
  "short",
  "sum",
  "part",
  "common",
  "general",
  "turn",
  "hand",
  "view",
  "mind",
  "fact",
  "effect",
  "practice",
  "particular",
  "public",
  "private",
]);

/** Possessive determiner + "own" finishes ("of its own."). */
const POSSESSIVE_DETERMINERS = new Set([
  "its",
  "their",
  "his",
  "her",
  "our",
  "my",
  "your",
]);

/**
 * Adjective after a determiner / preposition / bare quantifier is mid-NP.
 * Predicate adjectives after a copula (or "is clear and memorable") are complete.
 * Complements after "than"/"as" ("rather than shown") stay finite.
 */
function endsOnOrphanedAttributive(
  words: string[],
  lastIndex: number,
  last: string,
): boolean {
  const isAttributive =
    looksLikeAttributiveAdjective(last) || looksLikePastParticipleForm(last);
  if (!isAttributive) return false;

  // Walk back through "and"/"or" + adjectives; complete if a copula heads the chain.
  let i = lastIndex - 1;
  while (i >= 0) {
    const w = normalizeTerminalToken(words[i]!);
    if (!w) {
      i -= 1;
      continue;
    }
    if (w === "and" || w === "or") {
      i -= 1;
      continue;
    }
    if (looksLikeAttributiveAdjective(w) || looksLikePastParticipleForm(w)) {
      i -= 1;
      continue;
    }
    if (COPULA_TERMINALS.has(w)) {
      return false; // "is clear and memorable"
    }
    if (TERMINAL_DETERMINERS.has(w)) {
      // "of its own" finishes; "one own" would be rare nonsense still incomplete if not possessive.
      if (last === "own" && POSSESSIVE_DETERMINERS.has(w)) {
        return false;
      }
      return true; // "one actual", "one sustained", "the named"
    }
    if (w === "than" || w === "as") {
      // "rather than shown" / "as named" — comparison complement can finish the sentence.
      return false;
    }
    if (TERMINAL_PREPOSITIONS.has(w)) {
      if (COMPLETE_PREPOSITIONAL_COMPLEMENTS.has(last)) {
        return false; // "in full", "at all"
      }
      // "in actual", "without spiritual" — need a following noun.
      // Participle after of ("instead of buried") can finish; pure adj cannot.
      if (looksLikePastParticipleForm(last) && !looksLikeAttributiveAdjective(last)) {
        return false;
      }
      // Participial forms also listed as attributive ("sustained") after prep are still mid-NP.
      if (looksLikeAttributiveAdjective(last) && !looksLikePastParticipleForm(last)) {
        return true;
      }
      if (looksLikePastParticipleForm(last)) {
        // "of sustained" / "in buried" — still mid-NP; keep as incomplete.
        return true;
      }
      return true;
    }
    // Content word that is not a copula before the adjective — e.g. "room loud".
    // Prefer incomplete for known attributives; allow participles ("claims asserted").
    if (looksLikeAttributiveAdjective(last) && !looksLikePastParticipleForm(last)) {
      return true;
    }
    return false;
  }
  // Leading adjective / "And memorable." — treat as incomplete.
  return true;
}

/** Last content word before the terminal period (lowercased, stripped of trailing punct). */
export function terminalContentWord(text: string): string {
  const normalized = normalizeVerdictLine(text);
  const withoutPeriod = normalized.replace(/\.+$/, "").trim();
  if (!withoutPeriod) return "";
  const words = withoutPeriod.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? "";
  return normalizeTerminalToken(last);
}

/**
 * True when a line ends on a word that needs a following object — conjunction,
 * preposition, comparative, determiner, incomplete verb, gerund, adverb,
 * adjective mid-NP, etc. Used for model-quality retry, never for truncation.
 * Pure digit/symbol tokens still count as finished terminals (not incomplete).
 */
export function endsOnIncompleteGrammaticalTail(text: string): boolean {
  const normalized = normalizeVerdictLine(text);
  const withoutPeriod = normalized.replace(/\.+$/, "").trim();
  if (!withoutPeriod) return true;

  const words = withoutPeriod.split(/\s+/).filter(Boolean);
  const rawLast = words[words.length - 1] ?? "";
  if (!rawLast) return true;

  const last = normalizeTerminalToken(rawLast);
  // "word 1" / verse marks — digit-only terminal is finite enough not to dangle.
  if (!last) {
    return !/[a-zA-Z0-9]/.test(rawLast);
  }

  if (INCOMPLETE_TERMINAL_WORDS.has(last)) return true;

  // Gerunds / present participles: "…and staying.", "…without defusing."
  if (looksLikeGerundOrPresentParticiple(last)) return true;

  // Manner / sentence adverbs: "…or spiritually."
  if (looksLikeLyAdverb(last)) return true;

  const prev =
    words.length >= 2
      ? normalizeTerminalToken(words[words.length - 2]!)
      : "";

  // Bare comparative / superlative needing complement: "…rather deeper."
  // Predicate after copula ("is clearer.") is finite enough to keep.
  if (
    looksLikeComparativeOrSuperlative(last) &&
    !COPULA_TERMINALS.has(prev)
  ) {
    return true;
  }

  // Orphaned attributive adjectives / participles after det/prep/quantifier.
  if (endsOnOrphanedAttributive(words, words.length - 1, last)) return true;

  return false;
}

/**
 * Known rubric / register misspellings that should force a quality retry.
 * Map: misspelling → preferred form (for logging only).
 */
const KNOWN_MISSPELLINGS = new Map<string, string>([
  ["exgetically", "exegetically"],
  ["exgetical", "exegetical"],
  ["exegesisly", "exegetically"],
]);

/** First known misspelling token in the line, or null. */
export function findKnownMisspelling(text: string): {
  found: string;
  preferred: string;
} | null {
  const normalized = normalizeVerdictLine(text);
  const withoutPeriod = normalized.replace(/\.+$/, "").trim();
  if (!withoutPeriod) return null;
  for (const raw of withoutPeriod.split(/\s+/).filter(Boolean)) {
    const token = normalizeTerminalToken(raw);
    const preferred = KNOWN_MISSPELLINGS.get(token);
    if (preferred) return { found: token, preferred };
  }
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

export type OverlongVerdictLine = {
  id: number;
  wordCount: number;
  lastWord: string;
  attemptPreview: string;
};

/**
 * Collect lines still over the word target after generation/retry.
 * Never mutates text — 18 words is a target, not a hard ceiling.
 */
export function collectOverlongVerdictLines(
  linesById: ReadonlyMap<number, string>,
  maxWords: number = VERDICT_LINE_MAX_WORDS,
): OverlongVerdictLine[] {
  const overlong: OverlongVerdictLine[] = [];
  for (const [id, line] of linesById) {
    const wordCount = countWords(line);
    if (wordCount <= maxWords) continue;
    overlong.push({
      id,
      wordCount,
      lastWord: terminalContentWord(line),
      attemptPreview: line.length > 120 ? `${line.slice(0, 117)}...` : line,
    });
  }
  return overlong;
}

// ---------------------------------------------------------------------------
// Sentence parse heuristics (incomplete tail + subject-verb agreement)
// ---------------------------------------------------------------------------

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
  | "incomplete_grammatical_tail"
  | "subject_verb_agreement"
  | "known_misspelling"
  | "em_dash";

export type VerdictLineQualityIssue = {
  id: number;
  score: number;
  reason: VerdictLineQualityIssueReason;
  detail: string;
  line: string;
};

export type SentenceParseIssue = {
  reason: VerdictLineQualityIssueReason;
  detail: string;
};

/**
 * Whether the line fails to parse as a coherent sentence under practical
 * heuristics: dangling terminal words, basic 3sg subject-verb disagreement,
 * or known rubric misspellings (e.g. "exgetically").
 * Single-clause lines (no hinge) are valid when the narrative is single-clause.
 */
export function detectSentenceParseIssues(
  text: string,
): SentenceParseIssue[] {
  const issues: SentenceParseIssue[] = [];
  const normalized = normalizeVerdictLine(text);
  if (!normalized) {
    issues.push({
      reason: "incomplete_grammatical_tail",
      detail: "empty after normalize",
    });
    return issues;
  }

  if (endsOnIncompleteGrammaticalTail(normalized)) {
    const last = terminalContentWord(normalized);
    issues.push({
      reason: "incomplete_grammatical_tail",
      detail: last
        ? `ends on incomplete tail "${last}"`
        : "ends on empty terminal word",
    });
  }

  const sv = detectSubjectVerbAgreementIssue(normalized);
  if (sv) {
    issues.push({
      reason: "subject_verb_agreement",
      detail: `subject-verb agreement: singular "${sv.subject}" + bare verb "${sv.verb}" (needs 3sg -s)`,
    });
  }

  const misspelling = findKnownMisspelling(normalized);
  if (misspelling) {
    issues.push({
      reason: "known_misspelling",
      detail: `known misspelling "${misspelling.found}" (prefer "${misspelling.preferred}")`,
    });
  }

  if (/[\u2014\u2013]/.test(normalized) || /--/.test(normalized)) {
    issues.push({
      reason: "em_dash",
      detail: "contains an em-dash, en-dash, or double hyphen",
    });
  }

  return issues;
}

/** True when any sentence-parse heuristic fails. */
export function failsSentenceParse(text: string): boolean {
  return detectSentenceParseIssues(text).length > 0;
}

/**
 * Collect quality invalidations for retry: lines that do not parse as a
 * complete sentence (incomplete grammatical tail or SV disagreement).
 * Hinge / both-halves is never required for acceptance.
 */
export function collectVerdictLineQualityIssues(
  linesById: ReadonlyMap<number, string>,
  scoresById: ReadonlyMap<number, number>,
): VerdictLineQualityIssue[] {
  const issues: VerdictLineQualityIssue[] = [];

  for (const [id, line] of linesById) {
    const score = scoresById.get(id) ?? 0;
    for (const parseIssue of detectSentenceParseIssues(line)) {
      issues.push({
        id,
        score,
        reason: parseIssue.reason,
        detail: parseIssue.detail,
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
