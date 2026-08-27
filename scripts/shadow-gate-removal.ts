/**
 * Shadow run: does removing the upward-pressure scoring language change the
 * criterion distribution? Nothing here ships.
 *
 * Adapted from scripts/compare-scoring-models.ts. Same read-only posture:
 * no insert into sermon_evaluations or any other table, no prompt_version bump,
 * no edit to rubric.md / SKILL.md, no env writes.
 *
 * Two arms per sermon, identical inputs, one variable:
 *   A  current buildSystemPrompt(), byte-for-byte
 *   B  same prompt with SCORING_STRENGTH_GATE removed entirely and the
 *      "Withholding a deserved 5 is a scoring error." sentence removed from
 *      SCORING_CALIBRATION. Nothing else in that block changes.
 *
 * prompt.ts is NOT modified. Arm B is built in this script by excising two
 * spans from the assembled system prompt, guarded by assertions that fail
 * loudly if the source text drifts. The excision is delivered through
 * runEvaluation's existing `createMessage` hook.
 *
 * Usage:
 *   npx tsx scripts/shadow-gate-removal.ts --verify-prompts   (no API, no DB)
 *   npx tsx scripts/shadow-gate-removal.ts --select-only       (DB read only)
 *   npx tsx scripts/shadow-gate-removal.ts --estimate-only
 *   npx tsx scripts/shadow-gate-removal.ts
 *   npx tsx scripts/shadow-gate-removal.ts --force
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { computeEvalCostUsd } from "../src/lib/evaluation/eval-cost";
import {
  EVALUATION_PROMPT_VERSION,
  buildSystemPrompt,
  buildUserMessage,
} from "../src/lib/evaluation/prompt";
import { runEvaluation } from "../src/lib/evaluation/runEvaluation";
import {
  CANONICAL_CRITERION_BY_ID,
  CATEGORY_MAX_POINTS,
  categorySubtotal,
  type EvaluationResultStrict,
} from "../src/lib/evaluation/schema";
import { formatDisplayScoreBare } from "../src/lib/evaluation/display-score";
import { submitSermonEvaluationTool } from "../src/lib/evaluation/tool-schema";

/** Production scoring model. Passed explicitly so .env.local cannot swap it. */
const MODEL = "claude-opus-4-8";
const TARGET_SERMONS = 6;
const ARMS = ["A", "B"] as const;
const TARGET_PROMPT_VERSION = "v3.5";
/** Ladders open item 5: the 11/55 row is excluded from corpus statistics. */
const EXCLUDED_COMPOSITE = 11;
const ESTIMATED_OUTPUT_TOKENS = 10_000;
const CHARS_PER_TOKEN = 4;
/** Twelve Opus runs land near $5. Abort above this unless --force. */
const COST_ABORT_USD = 8;

type Arm = (typeof ARMS)[number];

// ---------------------------------------------------------------------------
// Arm B prompt surgery
// ---------------------------------------------------------------------------

/** Opening bytes of SCORING_STRENGTH_GATE in the assembled system prompt. */
const GATE_OPEN =
  "**REQUIRED per-criterion strength gate (procedural — run while scoring, not part of JSON):**";
/** Closing bytes of SCORING_STRENGTH_GATE. */
const GATE_CLOSE =
  "The submitted `narrative` is the published critique only and must match the locked score.";
/** The one sentence removed from SCORING_CALIBRATION. Trailing space included. */
const WITHHOLD_SENTENCE =
  "**Withholding a deserved 5 is a scoring error.** ";

/** Strings that must survive into arm B. Guards against over-wide excision. */
const ARM_B_MUST_KEEP = [
  "## SCORING CALIBRATION (TOP OF SCALE — APPLY WHEN ASSIGNING CRITERION SCORES)",
  "**When to award 5:**",
  "Award 5 when the evidence supports it; do not inflate the rest of the scale.",
  "**3 vs 4 decision rule:**",
  'Reserve **3** for criteria that are merely adequate',
  "# Rubric Reference (v2)",
  "## MELODIC LINE AND BIG IDEA (DESCRIPTIVE — NOT SCORED)",
  "## STRUCTURAL CONTRACT (NON-NEGOTIABLE)",
  "**PER-CRITERION CLOSE**",
];

/** Strings that must be gone from arm B. */
const ARM_B_MUST_DROP = [
  GATE_OPEN,
  GATE_CLOSE,
  WITHHOLD_SENTENCE,
  "you may not assign 3",
  "Withholding a deserved 5",
  "REQUIRED per-criterion strength gate",
];

function requireSingleOccurrence(haystack: string, needle: string, label: string): number {
  const first = haystack.indexOf(needle);
  if (first === -1) {
    throw new Error(
      `Arm B surgery aborted: ${label} not found in the system prompt. prompt.ts has drifted; re-read it before running.`,
    );
  }
  if (haystack.indexOf(needle, first + needle.length) !== -1) {
    throw new Error(
      `Arm B surgery aborted: ${label} occurs more than once. Excision would be ambiguous.`,
    );
  }
  return first;
}

type ArmBSurgery = {
  prompt: string;
  removedGate: string;
  removedSentence: string;
};

/**
 * Excise the two spans from the assembled prompt.
 * Everything outside those spans is preserved byte-for-byte.
 */
function buildArmBPrompt(armA: string): ArmBSurgery {
  const gateOpenIdx = requireSingleOccurrence(armA, GATE_OPEN, "SCORING_STRENGTH_GATE opening");
  const gateCloseIdx = requireSingleOccurrence(armA, GATE_CLOSE, "SCORING_STRENGTH_GATE closing");

  if (gateCloseIdx < gateOpenIdx) {
    throw new Error("Arm B surgery aborted: gate closing text precedes its opening.");
  }

  // buildSystemPrompt joins SCORING_CALIBRATION and SCORING_STRENGTH_GATE with
  // a blank line. Take that separator with the gate so arm B has no orphan gap.
  const separator = armA.slice(gateOpenIdx - 2, gateOpenIdx);
  if (separator !== "\n\n") {
    throw new Error(
      `Arm B surgery aborted: expected a blank line before the gate, found ${JSON.stringify(separator)}.`,
    );
  }

  const gateStart = gateOpenIdx - 2;
  const gateEnd = gateCloseIdx + GATE_CLOSE.length;
  const removedGate = armA.slice(gateStart, gateEnd);

  const withoutGate = armA.slice(0, gateStart) + armA.slice(gateEnd);

  const withholdIdx = requireSingleOccurrence(
    withoutGate,
    WITHHOLD_SENTENCE,
    "SCORING_CALIBRATION withholding sentence",
  );
  const prompt =
    withoutGate.slice(0, withholdIdx) +
    withoutGate.slice(withholdIdx + WITHHOLD_SENTENCE.length);

  const expectedLength = armA.length - removedGate.length - WITHHOLD_SENTENCE.length;
  if (prompt.length !== expectedLength) {
    throw new Error(
      `Arm B surgery aborted: length check failed (${prompt.length} vs expected ${expectedLength}).`,
    );
  }

  for (const keep of ARM_B_MUST_KEEP) {
    if (!prompt.includes(keep)) {
      throw new Error(
        `Arm B surgery aborted: excision removed text it should have kept (${JSON.stringify(keep.slice(0, 60))}).`,
      );
    }
  }
  for (const drop of ARM_B_MUST_DROP) {
    if (prompt.includes(drop)) {
      throw new Error(
        `Arm B surgery aborted: text that should be gone is still present (${JSON.stringify(drop.slice(0, 60))}).`,
      );
    }
  }

  return { prompt, removedGate, removedSentence: WITHHOLD_SENTENCE };
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// Env + args
// ---------------------------------------------------------------------------

function loadEnvLocalIfPresent(): void {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

type Args = {
  verifyPrompts: boolean;
  selectOnly: boolean;
  estimateOnly: boolean;
  force: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    verifyPrompts: false,
    selectOnly: false,
    estimateOnly: false,
    force: false,
  };

  for (const token of argv.slice(2)) {
    switch (token) {
      case "--verify-prompts":
        args.verifyPrompts = true;
        break;
      case "--select-only":
        args.selectOnly = true;
        break;
      case "--estimate-only":
        args.estimateOnly = true;
        break;
      case "--force":
        args.force = true;
        break;
      default:
        console.error(`Unknown flag: ${token}`);
        process.exit(1);
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function padLeft(value: string, width: number): string {
  return value.length >= width ? value : " ".repeat(width - value.length) + value;
}

function mean(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, n) => sum + n, 0) / values.length;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

// ---------------------------------------------------------------------------
// Candidate selection
// ---------------------------------------------------------------------------

type Candidate = {
  evaluationId: string;
  sermonVersionId: string;
  sermonId: string;
  title: string;
  primaryPassage: string | null;
  manuscript: string;
  manuscriptChars: number;
  manuscriptSha256: string;
  storedComposite: number | null;
  storedBand: string | null;
  storedCompositeSimple: number | null;
  storedCriterionScores: Record<number, number>;
  reportMode: string | null;
  createdAt: string | null;
  sermonDeleted: boolean;
  /** True when the stored result carries a fingerprint of a SermonContext. */
  contextSignal: boolean;
  contextSignalReasons: string[];
};

/**
 * SermonContext is never persisted (browser storage only, passed straight into
 * the job), so "submitted without context" is not directly queryable. These are
 * the fingerprints a context block leaves in the stored result.
 */
function detectContextSignal(result: unknown): string[] {
  const reasons: string[] = [];
  if (typeof result !== "object" || result === null) return reasons;

  const record = result as Record<string, unknown>;
  const meta = record.meta as Record<string, unknown> | undefined;
  const mlbi = record.melodic_line_and_big_idea as
    | Record<string, unknown>
    | undefined;

  const churchOrContext = meta?.church_or_context;
  if (typeof churchOrContext === "string" && churchOrContext.trim()) {
    reasons.push(`meta.church_or_context="${churchOrContext.trim().slice(0, 40)}"`);
  }

  const seriesName = meta?.series_name;
  if (typeof seriesName === "string" && seriesName.trim()) {
    reasons.push(`meta.series_name="${seriesName.trim().slice(0, 40)}"`);
  }

  // MELODIC LINE OVERRIDE fires only when context.workingMelodicLine is set.
  if (mlbi?.reading_source === "preacher") {
    reasons.push("reading_source=preacher");
  }

  return reasons;
}

function criterionScores(result: unknown): Map<number, number> {
  const scores = new Map<number, number>();
  if (typeof result !== "object" || result === null) return scores;
  const categories = (result as Record<string, unknown>).categories;
  if (!Array.isArray(categories)) return scores;

  for (const category of categories) {
    const criteria = (category as Record<string, unknown>)?.criteria;
    if (!Array.isArray(criteria)) continue;
    for (const criterion of criteria) {
      const row = criterion as Record<string, unknown>;
      if (typeof row.id === "number" && typeof row.score === "number") {
        scores.set(row.id, row.score);
      }
    }
  }
  return scores;
}

type SupabaseClient = ReturnType<typeof createClient>;

function adminClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type CandidatePool = {
  candidates: Candidate[];
  totalV35Complete: number;
  excludedElevenRows: number;
  emptyManuscriptRows: number;
  excludedSoftDeleted: number;
  distinctSermons: number;
  /** Stored criterion distribution across the whole v3.5 pool, for context. */
  storedDistribution: Record<number, Record<number, number>>;
};

/** id -> score -> count, across every candidate's stored result. */
function buildStoredDistribution(
  candidates: Candidate[],
): Record<number, Record<number, number>> {
  const table: Record<number, Record<number, number>> = {};
  for (let id = 1; id <= 11; id++) {
    table[id] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  for (const candidate of candidates) {
    for (const [id, score] of Object.entries(candidate.storedCriterionScores)) {
      const row = table[Number(id)];
      if (row && score >= 1 && score <= 5) {
        row[score] += 1;
      }
    }
  }
  return table;
}

async function loadCandidates(supabase: SupabaseClient): Promise<CandidatePool> {
  const { data: evaluations, error: evalError } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, sermon_version_id, overall_score, score_band, report_mode, created_at, result",
    )
    .eq("prompt_version", TARGET_PROMPT_VERSION)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (evalError) {
    throw new Error(evalError.message);
  }

  const rows = evaluations ?? [];
  const totalV35Complete = rows.length;

  let excludedElevenRows = 0;
  const keptRows: typeof rows = [];
  for (const row of rows) {
    if (row.overall_score === EXCLUDED_COMPOSITE) {
      excludedElevenRows += 1;
      continue;
    }
    keptRows.push(row);
  }

  const versionIds = Array.from(
    new Set(
      keptRows
        .map((row) => row.sermon_version_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  );

  if (versionIds.length === 0) {
    return {
      candidates: [],
      totalV35Complete,
      excludedElevenRows,
      emptyManuscriptRows: 0,
      excludedSoftDeleted: 0,
      distinctSermons: 0,
      storedDistribution: buildStoredDistribution([]),
    };
  }

  const { data: versions, error: versionError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id, content")
    .in("id", versionIds);

  if (versionError) {
    throw new Error(versionError.message);
  }

  const versionById = new Map(
    (versions ?? []).map((row) => [row.id as string, row]),
  );

  const sermonIds = Array.from(
    new Set(
      (versions ?? [])
        .map((row) => row.sermon_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  );

  const { data: sermons, error: sermonError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, deleted_at")
    .in("id", sermonIds);

  if (sermonError) {
    throw new Error(sermonError.message);
  }

  const sermonById = new Map((sermons ?? []).map((row) => [row.id as string, row]));

  let emptyManuscriptRows = 0;
  let excludedSoftDeleted = 0;
  const candidates: Candidate[] = [];
  const seenSermonIds = new Set<string>();

  // keptRows is newest-first, so the first row per sermon is its latest v3.5 run.
  for (const row of keptRows) {
    const version = versionById.get(row.sermon_version_id as string);
    if (!version) continue;
    const sermon = sermonById.get(version.sermon_id as string);
    if (!sermon) continue;

    const manuscript = typeof version.content === "string" ? version.content : "";
    if (!manuscript.trim()) {
      emptyManuscriptRows += 1;
      continue;
    }

    // A soft-deleted sermon may have been discarded as a test submission.
    // Keep it out of the experiment rather than guess why it was removed.
    if (sermon.deleted_at != null) {
      excludedSoftDeleted += 1;
      continue;
    }

    const sermonId = sermon.id as string;
    if (seenSermonIds.has(sermonId)) continue;
    seenSermonIds.add(sermonId);

    const reasons = detectContextSignal(row.result);
    const scoring = (row.result as Record<string, unknown> | null)?.scoring as
      | Record<string, unknown>
      | undefined;

    candidates.push({
      evaluationId: row.id as string,
      sermonVersionId: row.sermon_version_id as string,
      sermonId,
      title: sermon.title as string,
      primaryPassage: (sermon.primary_passage as string | null) ?? null,
      manuscript,
      manuscriptChars: manuscript.length,
      manuscriptSha256: sha256(manuscript),
      storedComposite:
        typeof row.overall_score === "number" ? row.overall_score : null,
      storedBand: (row.score_band as string | null) ?? null,
      storedCompositeSimple:
        typeof scoring?.composite_simple === "number"
          ? (scoring.composite_simple as number)
          : null,
      storedCriterionScores: Object.fromEntries(criterionScores(row.result)),
      reportMode: (row.report_mode as string | null) ?? null,
      createdAt: (row.created_at as string | null) ?? null,
      sermonDeleted: sermon.deleted_at != null,
      contextSignal: reasons.length > 0,
      contextSignalReasons: reasons,
    });
  }

  return {
    candidates,
    totalV35Complete,
    excludedElevenRows,
    emptyManuscriptRows,
    excludedSoftDeleted,
    distinctSermons: candidates.length,
    storedDistribution: buildStoredDistribution(candidates),
  };
}

/** Even spread across the stored-composite range, min and max always included. */
function spreadSelect(sorted: Candidate[], count: number): Candidate[] {
  if (sorted.length <= count) return [...sorted];
  const picked: Candidate[] = [];
  const chosen = new Set<number>();
  for (let k = 0; k < count; k++) {
    let index = Math.round((k * (sorted.length - 1)) / (count - 1));
    while (chosen.has(index) && index < sorted.length - 1) index += 1;
    while (chosen.has(index) && index > 0) index -= 1;
    if (chosen.has(index)) continue;
    chosen.add(index);
    picked.push(sorted[index]);
  }
  return picked;
}

type Selection = {
  selected: Candidate[];
  noContextCount: number;
  contextSignalCount: number;
  filledFromContextSignal: number;
};

function selectSermons(candidates: Candidate[]): Selection {
  const byComposite = (a: Candidate, b: Candidate) =>
    (a.storedComposite ?? 0) - (b.storedComposite ?? 0);

  const noContext = candidates.filter((row) => !row.contextSignal).sort(byComposite);
  const withContext = candidates.filter((row) => row.contextSignal).sort(byComposite);

  const preferred = spreadSelect(noContext, TARGET_SERMONS);
  let filledFromContextSignal = 0;

  if (preferred.length < TARGET_SERMONS) {
    const shortfall = TARGET_SERMONS - preferred.length;
    const filler = spreadSelect(withContext, shortfall);
    filledFromContextSignal = filler.length;
    preferred.push(...filler);
  }

  return {
    selected: preferred.sort(byComposite),
    noContextCount: noContext.length,
    contextSignalCount: withContext.length,
    filledFromContextSignal,
  };
}

function printSelection(pool: CandidatePool, selection: Selection): void {
  console.log("");
  console.log("SELECTION");
  console.log("-".repeat(96));
  console.log(`prompt_version='${TARGET_PROMPT_VERSION}' complete rows: ${pool.totalV35Complete}`);
  console.log(`  excluded, stored composite ${EXCLUDED_COMPOSITE}/55: ${pool.excludedElevenRows}`);
  console.log(`  excluded, empty manuscript: ${pool.emptyManuscriptRows}`);
  console.log(`  excluded, sermon soft-deleted: ${pool.excludedSoftDeleted}`);
  console.log(`  distinct sermons available (latest v3.5 run each): ${pool.distinctSermons}`);
  console.log(`  no context fingerprint: ${selection.noContextCount}`);
  console.log(`  context fingerprint present: ${selection.contextSignalCount}`);

  console.log("");
  console.log(
    `STORED v3.5 BASELINE across all ${pool.distinctSermons} available sermons (not the six)`,
  );
  console.log("-".repeat(96));
  console.log(
    [
      pad("id", 3),
      pad("criterion", 36),
      padLeft("1", 4),
      padLeft("2", 4),
      padLeft("3", 4),
      padLeft("4", 4),
      padLeft("5", 4),
      padLeft("%4or5", 7),
    ].join("  "),
  );
  for (let id = 1; id <= 11; id++) {
    const row = pool.storedDistribution[id];
    const total = [1, 2, 3, 4, 5].reduce((sum, score) => sum + row[score], 0);
    const highPct = total ? ((row[4] + row[5]) / total) * 100 : 0;
    console.log(
      [
        pad(String(id), 3),
        pad((CANONICAL_CRITERION_BY_ID[id] ?? `(id ${id})`).slice(0, 36), 36),
        padLeft(String(row[1]), 4),
        padLeft(String(row[2]), 4),
        padLeft(String(row[3]), 4),
        padLeft(String(row[4]), 4),
        padLeft(String(row[5]), 4),
        padLeft(`${highPct.toFixed(0)}%`, 7),
      ].join("  "),
    );
  }

  if (selection.noContextCount < TARGET_SERMONS) {
    console.log("");
    console.log(
      `  NOTE: only ${selection.noContextCount} sermons have no context fingerprint, fewer than the ${TARGET_SERMONS} requested.`,
    );
    console.log(
      `  Filled ${selection.filledFromContextSignal} slot(s) from rows that do carry one.`,
    );
  }

  console.log("");
  console.log(
    [
      pad("#", 3),
      pad("title", 34),
      pad("passage", 20),
      padLeft("stored/55", 10),
      pad("band", 20),
      padLeft("chars", 7),
      pad("ctx", 4),
    ].join("  "),
  );
  console.log("-".repeat(110));
  selection.selected.forEach((row, index) => {
    console.log(
      [
        pad(String(index + 1), 3),
        pad(row.title.slice(0, 34), 34),
        pad((row.primaryPassage ?? "(none)").slice(0, 20), 20),
        padLeft(row.storedComposite == null ? "?" : String(row.storedComposite), 10),
        pad((row.storedBand ?? "?").slice(0, 20), 20),
        padLeft(String(row.manuscriptChars), 7),
        pad(row.contextSignal ? "yes" : "no", 4),
      ].join("  "),
    );
  });

  console.log("");
  for (const row of selection.selected) {
    console.log(`  ${row.title.slice(0, 40)}`);
    console.log(`    sermon_version_id ${row.sermonVersionId}`);
    console.log(`    stored evaluation ${row.evaluationId} (${row.createdAt ?? "?"}, ${row.reportMode ?? "?"})`);
    console.log(`    manuscript sha256 ${row.manuscriptSha256}`);
    if (row.contextSignal) {
      console.log(`    context fingerprint: ${row.contextSignalReasons.join(", ")}`);
    }
    if (row.sermonDeleted) {
      console.log("    NOTE: sermon is soft-deleted (deleted_at set)");
    }
  }
}

// ---------------------------------------------------------------------------
// Run execution
// ---------------------------------------------------------------------------

type RunRecord = {
  arm: Arm;
  sermon_index: number;
  sermon_version_id: string;
  title: string;
  api_model: string;
  api_calls: number;
  system_prompt_sha256: string;
  system_prompt_chars: number;
  composite_simple: number;
  composite_weighted: number;
  band: string;
  display_10: number;
  criterion_scores: Array<{ id: number; name: string; score: number }>;
  category_subtotals: Array<{ number: number; name: string; subtotal: number; max: number }>;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  elapsed_ms: number;
};

function criterionRows(result: EvaluationResultStrict): RunRecord["criterion_scores"] {
  const rows: RunRecord["criterion_scores"] = [];
  for (const category of result.categories) {
    for (const criterion of category.criteria) {
      rows.push({ id: criterion.id, name: criterion.name, score: criterion.score });
    }
  }
  return rows.sort((a, b) => a.id - b.id);
}

function categoryRows(result: EvaluationResultStrict): RunRecord["category_subtotals"] {
  return result.categories.map((category) => ({
    number: category.number,
    name: category.name,
    subtotal: categorySubtotal(category.criteria),
    max: CATEGORY_MAX_POINTS[category.number] ?? category.criteria.length * 5,
  }));
}

function estimateInputTokens(systemPrompt: string, userMessage: string): number {
  const tools = JSON.stringify(submitSermonEvaluationTool);
  return Math.ceil(
    (systemPrompt.length + userMessage.length + tools.length) / CHARS_PER_TOKEN,
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  loadEnvLocalIfPresent();

  const armAPrompt = buildSystemPrompt();
  const surgery = buildArmBPrompt(armAPrompt);
  const armBPrompt = surgery.prompt;

  const promptsByArm: Record<Arm, string> = { A: armAPrompt, B: armBPrompt };

  console.log("Shadow run: strength-gate removal (no DB writes, nothing ships)");
  console.log(`Prompt version: ${EVALUATION_PROMPT_VERSION} (unchanged, not bumped)`);
  console.log(`Model: ${MODEL} (passed explicitly on every call)`);
  console.log(
    `  EVALUATION_MODEL in env is ${process.env.EVALUATION_MODEL ?? "(unset)"} and is deliberately ignored.`,
  );
  console.log("");
  console.log("PROMPT ARMS");
  console.log("-".repeat(96));
  console.log(`A  ${armAPrompt.length} chars  sha256 ${sha256(armAPrompt)}`);
  console.log(`B  ${armBPrompt.length} chars  sha256 ${sha256(armBPrompt)}`);
  console.log(
    `Removed: ${surgery.removedGate.length} chars of SCORING_STRENGTH_GATE (with its leading blank line)`,
  );
  console.log(
    `Removed: ${surgery.removedSentence.length} chars, the withholding sentence in SCORING_CALIBRATION`,
  );
  console.log(
    `Delta: ${armAPrompt.length - armBPrompt.length} chars, roughly ${Math.round((armAPrompt.length - armBPrompt.length) / CHARS_PER_TOKEN)} tokens`,
  );

  if (args.verifyPrompts) {
    console.log("");
    console.log("REMOVED SPAN 1 — SCORING_STRENGTH_GATE");
    console.log("=".repeat(96));
    console.log(surgery.removedGate.trimStart());
    console.log("");
    console.log("REMOVED SPAN 2 — SCORING_CALIBRATION sentence");
    console.log("=".repeat(96));
    console.log(JSON.stringify(surgery.removedSentence));
    console.log("");
    console.log("All arm B assertions passed. --verify-prompts made no API or DB calls.");
    return;
  }

  const supabase = adminClient();
  const pool = await loadCandidates(supabase);
  const selection = selectSermons(pool.candidates);

  printSelection(pool, selection);

  if (selection.selected.length === 0) {
    console.error("");
    console.error("No qualifying sermons. Stopping.");
    process.exit(1);
  }

  if (selection.selected.length < TARGET_SERMONS) {
    console.log("");
    console.log(
      `NOTE: only ${selection.selected.length} sermons qualify, fewer than the ${TARGET_SERMONS} requested. Proceeding with ${selection.selected.length}.`,
    );
  }

  if (args.selectOnly) {
    console.log("");
    console.log("--select-only: not calling the API.");
    return;
  }

  requireEnv("ANTHROPIC_API_KEY");

  // Cost pre-estimate
  console.log("");
  console.log("COST PRE-ESTIMATE");
  console.log("-".repeat(96));
  let totalEstimate = 0;
  for (const sermon of selection.selected) {
    const userMessage = buildUserMessage({
      sermonTitle: sermon.title,
      manuscript: sermon.manuscript,
      ...(sermon.primaryPassage ? { primaryPassage: sermon.primaryPassage } : {}),
    });
    for (const arm of ARMS) {
      const inputTokens = estimateInputTokens(promptsByArm[arm], userMessage);
      const cost = computeEvalCostUsd(MODEL, {
        input_tokens: inputTokens,
        output_tokens: ESTIMATED_OUTPUT_TOKENS,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      });
      totalEstimate += cost ?? 0;
    }
  }
  const runCount = selection.selected.length * ARMS.length;
  console.log(
    `${runCount} runs (${selection.selected.length} sermons × ${ARMS.length} arms) at ~${ESTIMATED_OUTPUT_TOKENS} output tokens each`,
  );
  console.log(`  Total: ~$${totalEstimate.toFixed(2)}`);
  console.log(`  Abort threshold: $${COST_ABORT_USD.toFixed(2)}${args.force ? " (--force set, threshold ignored)" : ""}`);
  console.log(
    "  Prompt-prefix caching is not assumed. Schema retries are not included; a retry roughly doubles that run.",
  );

  if (totalEstimate > COST_ABORT_USD && !args.force) {
    console.error("");
    console.error(
      `Estimate $${totalEstimate.toFixed(2)} exceeds $${COST_ABORT_USD.toFixed(2)}. Stopping. Re-run with --force to override.`,
    );
    process.exit(2);
  }

  if (args.estimateOnly) {
    console.log("");
    console.log("--estimate-only: not calling the API.");
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const runs: RunRecord[] = [];
  let actualCost = 0;

  for (const [index, sermon] of selection.selected.entries()) {
    for (const arm of ARMS) {
      const systemPrompt = promptsByArm[arm];
      let apiCalls = 0;
      let sentPromptSha = "";

      // The only difference between the arms is the system text swapped in here.
      const createMessage = async (
        params: Anthropic.Messages.MessageCreateParamsNonStreaming,
      ) => {
        apiCalls += 1;
        const system = params.system;
        if (!Array.isArray(system) || system.length !== 1 || system[0].type !== "text") {
          throw new Error(
            "Unexpected system block shape from runEvaluation; aborting rather than guessing.",
          );
        }
        const original = system[0].text;
        if (original !== armAPrompt) {
          throw new Error(
            "runEvaluation's system prompt is not byte-identical to buildSystemPrompt(); aborting.",
          );
        }
        sentPromptSha = sha256(systemPrompt);
        return client.messages.create({
          ...params,
          system: [{ ...system[0], text: systemPrompt }],
        });
      };

      console.log("");
      console.log(
        `Running sermon ${index + 1}/${selection.selected.length} arm ${arm}: ${sermon.title.slice(0, 40)}`,
      );

      const started = Date.now();
      const { result, model: apiModel, inputTokens, outputTokens } = await runEvaluation(
        {
          sermonTitle: sermon.title,
          manuscript: sermon.manuscript,
          ...(sermon.primaryPassage ? { primaryPassage: sermon.primaryPassage } : {}),
        },
        { model: MODEL, createMessage },
      );
      const elapsedMs = Date.now() - started;

      if (!apiModel.startsWith("claude-opus-4-8")) {
        console.error("");
        console.error(
          `ABORT: API echoed model "${apiModel}", expected claude-opus-4-8. Not continuing.`,
        );
        process.exit(3);
      }

      const cost = computeEvalCostUsd(MODEL, {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      });
      if (cost != null) actualCost += cost;

      runs.push({
        arm,
        sermon_index: index + 1,
        sermon_version_id: sermon.sermonVersionId,
        title: sermon.title,
        api_model: apiModel,
        api_calls: apiCalls,
        system_prompt_sha256: sentPromptSha,
        system_prompt_chars: systemPrompt.length,
        composite_simple: result.scoring.composite_simple,
        composite_weighted: result.scoring.composite_weighted,
        band: result.scoring.band,
        display_10: Number(formatDisplayScoreBare(result.scoring.composite_weighted)),
        criterion_scores: criterionRows(result),
        category_subtotals: categoryRows(result),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        elapsed_ms: elapsedMs,
      });

      console.log(
        `  ${result.scoring.composite_weighted}/55 weighted, ${result.scoring.composite_simple}/55 simple, ${result.scoring.band}  model ${apiModel}  calls ${apiCalls}  tokens ${inputTokens}/${outputTokens}  ${cost == null ? "cost unknown" : `$${cost.toFixed(2)}`}  ${elapsedMs}ms`,
      );
    }
  }

  printResults(selection.selected, runs);

  const outDir = join(process.cwd(), ".tmp-verify");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(outDir, `shadow-gate-removal-${stamp}.json`);

  const payload = {
    experiment: "gate-removal-shadow",
    prompt_version: EVALUATION_PROMPT_VERSION,
    model: MODEL,
    arms: {
      A: {
        description: "current buildSystemPrompt(), unchanged",
        system_prompt_sha256: sha256(armAPrompt),
        system_prompt_chars: armAPrompt.length,
      },
      B: {
        description:
          "SCORING_STRENGTH_GATE removed entirely; 'Withholding a deserved 5 is a scoring error.' removed from SCORING_CALIBRATION",
        system_prompt_sha256: sha256(armBPrompt),
        system_prompt_chars: armBPrompt.length,
        removed_gate_chars: surgery.removedGate.length,
        removed_sentence: surgery.removedSentence,
      },
    },
    selection: {
      target_prompt_version: TARGET_PROMPT_VERSION,
      excluded_composite: EXCLUDED_COMPOSITE,
      total_v35_complete: pool.totalV35Complete,
      excluded_eleven_rows: pool.excludedElevenRows,
      empty_manuscript_rows: pool.emptyManuscriptRows,
      excluded_soft_deleted: pool.excludedSoftDeleted,
      distinct_sermons_available: pool.distinctSermons,
      stored_v35_criterion_distribution: pool.storedDistribution,
      no_context_fingerprint_count: selection.noContextCount,
      context_fingerprint_count: selection.contextSignalCount,
      filled_from_context_fingerprint: selection.filledFromContextSignal,
      context_note:
        "SermonContext is not persisted anywhere; presence is inferred from stored-result fingerprints only.",
      sermons: selection.selected.map((row, index) => ({
        index: index + 1,
        sermon_id: row.sermonId,
        sermon_version_id: row.sermonVersionId,
        stored_evaluation_id: row.evaluationId,
        title: row.title,
        primary_passage: row.primaryPassage,
        manuscript_sha256: row.manuscriptSha256,
        manuscript_chars: row.manuscriptChars,
        stored_composite_weighted: row.storedComposite,
        stored_composite_simple: row.storedCompositeSimple,
        stored_band: row.storedBand,
        stored_criterion_scores: row.storedCriterionScores,
        report_mode: row.reportMode,
        created_at: row.createdAt,
        sermon_soft_deleted: row.sermonDeleted,
        context_fingerprint: row.contextSignal,
        context_fingerprint_reasons: row.contextSignalReasons,
      })),
    },
    runs,
    aggregates: buildAggregates(selection.selected, runs),
    estimated_cost_usd: Number(totalEstimate.toFixed(4)),
    actual_cost_usd: Number(actualCost.toFixed(4)),
  };

  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`Wrote ${outPath}`);
  console.log(`Actual API cost: $${actualCost.toFixed(2)}`);
  console.log("No rows were inserted or updated in any table.");
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function runFor(runs: RunRecord[], sermonIndex: number, arm: Arm): RunRecord | undefined {
  return runs.find((run) => run.sermon_index === sermonIndex && run.arm === arm);
}

function scoreMap(run: RunRecord | undefined): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of run?.criterion_scores ?? []) map.set(row.id, row.score);
  return map;
}

function buildAggregates(sermons: Candidate[], runs: RunRecord[]) {
  const armRuns = (arm: Arm) => runs.filter((run) => run.arm === arm);

  const countCriterion = (arm: Arm, id: number, scores: number[]) =>
    armRuns(arm).filter((run) => {
      const score = scoreMap(run).get(id);
      return score != null && scores.includes(score);
    }).length;

  const divergence = (arm: Arm) => {
    const rows = armRuns(arm);
    const deltas = rows.map((run) =>
      Math.abs(run.composite_weighted - run.composite_simple),
    );
    return {
      runs: rows.length,
      identical: deltas.filter((delta) => delta === 0).length,
      within_one: deltas.filter((delta) => delta <= 1).length,
      mean_abs_delta: Number(mean(deltas).toFixed(2)),
      max_abs_delta: deltas.length ? Math.max(...deltas) : 0,
      identical_pct: rows.length
        ? Number(((deltas.filter((d) => d === 0).length / rows.length) * 100).toFixed(1))
        : 0,
      within_one_pct: rows.length
        ? Number(((deltas.filter((d) => d <= 1).length / rows.length) * 100).toFixed(1))
        : 0,
    };
  };

  let bandChanges = 0;
  const bandDetail: Array<{ sermon_index: number; title: string; a: string; b: string }> = [];
  for (const [index] of sermons.entries()) {
    const a = runFor(runs, index + 1, "A");
    const b = runFor(runs, index + 1, "B");
    if (!a || !b) continue;
    if (a.band !== b.band) {
      bandChanges += 1;
      bandDetail.push({
        sermon_index: index + 1,
        title: a.title,
        a: a.band,
        b: b.band,
      });
    }
  }

  return {
    criterion_1_high_scores: {
      A: {
        fours: countCriterion("A", 1, [4]),
        fives: countCriterion("A", 1, [5]),
        fours_and_fives: countCriterion("A", 1, [4, 5]),
      },
      B: {
        fours: countCriterion("B", 1, [4]),
        fives: countCriterion("B", 1, [5]),
        fours_and_fives: countCriterion("B", 1, [4, 5]),
      },
    },
    criterion_2_fives: {
      A: countCriterion("A", 2, [5]),
      B: countCriterion("B", 2, [5]),
    },
    mean_composite_weighted: {
      A: Number(mean(armRuns("A").map((run) => run.composite_weighted)).toFixed(2)),
      B: Number(mean(armRuns("B").map((run) => run.composite_weighted)).toFixed(2)),
    },
    mean_composite_simple: {
      A: Number(mean(armRuns("A").map((run) => run.composite_simple)).toFixed(2)),
      B: Number(mean(armRuns("B").map((run) => run.composite_simple)).toFixed(2)),
    },
    band_changes: { count: bandChanges, detail: bandDetail },
    simple_vs_weighted_divergence: { A: divergence("A"), B: divergence("B") },
  };
}

function printResults(sermons: Candidate[], runs: RunRecord[]): void {
  for (const [index, sermon] of sermons.entries()) {
    const sermonIndex = index + 1;
    const a = runFor(runs, sermonIndex, "A");
    const b = runFor(runs, sermonIndex, "B");
    if (!a || !b) continue;

    const aScores = scoreMap(a);
    const bScores = scoreMap(b);

    console.log("");
    console.log("=".repeat(96));
    console.log(`SERMON ${sermonIndex}: ${sermon.title}`);
    console.log(
      `${sermon.primaryPassage ?? "(no passage)"}  ·  stored ${sermon.storedComposite ?? "?"}/55 ${sermon.storedBand ?? ""}  ·  version ${sermon.sermonVersionId}`,
    );
    console.log("=".repeat(96));
    console.log(
      [pad("id", 3), pad("criterion", 36), padLeft("A", 3), padLeft("B", 3), padLeft("delta", 6)].join(
        "  ",
      ),
    );
    console.log("-".repeat(58));

    for (let id = 1; id <= 11; id++) {
      const name = CANONICAL_CRITERION_BY_ID[id] ?? `(id ${id})`;
      const aScore = aScores.get(id);
      const bScore = bScores.get(id);
      const delta =
        aScore != null && bScore != null ? signed(bScore - aScore) : "?";
      console.log(
        [
          pad(String(id), 3),
          pad(name.slice(0, 36), 36),
          padLeft(aScore == null ? "?" : String(aScore), 3),
          padLeft(bScore == null ? "?" : String(bScore), 3),
          padLeft(delta, 6),
        ].join("  "),
      );
    }

    console.log("-".repeat(58));
    for (const run of [a, b]) {
      console.log(
        `arm ${run.arm}  composite_simple ${run.composite_simple}/55  composite_weighted ${run.composite_weighted}/55  ${formatDisplayScoreBare(run.composite_weighted)}/10  band ${run.band}`,
      );
    }
  }

  const agg = buildAggregates(sermons, runs);

  console.log("");
  console.log("=".repeat(96));
  console.log(`ACROSS ALL ${sermons.length} SERMONS`);
  console.log("=".repeat(96));

  console.log("");
  console.log("1. Criterion 1 (Textual fidelity & exegesis), count of 4s and 5s");
  console.log(
    `   A: ${agg.criterion_1_high_scores.A.fours} fours, ${agg.criterion_1_high_scores.A.fives} fives, ${agg.criterion_1_high_scores.A.fours_and_fives}/${sermons.length} at 4 or 5`,
  );
  console.log(
    `   B: ${agg.criterion_1_high_scores.B.fours} fours, ${agg.criterion_1_high_scores.B.fives} fives, ${agg.criterion_1_high_scores.B.fours_and_fives}/${sermons.length} at 4 or 5`,
  );

  console.log("");
  console.log("2. Criterion 2 (Christ-centered / redemptive arc), count of 5s");
  console.log(`   A: ${agg.criterion_2_fives.A}/${sermons.length}`);
  console.log(`   B: ${agg.criterion_2_fives.B}/${sermons.length}`);

  console.log("");
  console.log("3. Mean composite_weighted");
  console.log(`   A: ${agg.mean_composite_weighted.A}/55`);
  console.log(`   B: ${agg.mean_composite_weighted.B}/55`);
  console.log(
    `   delta: ${signed(Number((agg.mean_composite_weighted.B - agg.mean_composite_weighted.A).toFixed(2)))}`,
  );

  console.log("");
  console.log("4. Band changes between A and B");
  console.log(`   ${agg.band_changes.count} of ${sermons.length} sermons changed band`);
  for (const row of agg.band_changes.detail) {
    console.log(`     sermon ${row.sermon_index} ${row.title.slice(0, 40)}: ${row.a} -> ${row.b}`);
  }

  console.log("");
  console.log("5. composite_simple vs composite_weighted divergence (4.1 acceptance test)");
  for (const arm of ARMS) {
    const d = agg.simple_vs_weighted_divergence[arm];
    console.log(
      `   ${arm}: identical on ${d.identical}/${d.runs} (${d.identical_pct}%), within one on ${d.within_one}/${d.runs} (${d.within_one_pct}%), mean abs delta ${d.mean_abs_delta}, max ${d.max_abs_delta}`,
    );
  }

  console.log("");
  console.log("6. Mean composite_simple");
  console.log(`   A: ${agg.mean_composite_simple.A}/55`);
  console.log(`   B: ${agg.mean_composite_simple.B}/55`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
