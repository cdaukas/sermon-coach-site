/**
 * PHASE 3 VARIANCE SWEEP + CROSS-SERMON COMPARISON.
 *
 * Phase 2 measured within-sermon variance on one manuscript. A high noise
 * ratio there is strong evidence on its own; a zero is weaker, because a
 * criterion can be perfectly stable on a sermon that sits solidly inside one
 * band and swing elsewhere. This runs the identical sweep on a second
 * manuscript that scored differently on the criterion in question, then puts
 * the two within-sermon standard deviations side by side against the corpus
 * standard deviation so a stable-everywhere criterion can be told apart from
 * one that was only stable on the first sermon.
 *
 * The target is named by EVALUATION id. The sermon_version_id is resolved
 * with a select against sermon_evaluations.sermon_version_id (the foreign
 * key declared in migration 20260525120000). An evaluation id is not a
 * version id and passing one where the other belongs silently evaluates the
 * wrong manuscript.
 *
 * Corpus standard deviation is computed here from sermon_evaluations rather
 * than taken as a given, so that it and the within-sermon figures come out
 * of the same function. A ratio built from a sample sd over a population sd
 * is wrong in a way that does not announce itself.
 *
 * Statistics helpers are imported from phase2-variance.mts rather than
 * reimplemented, so the two sweeps cannot drift apart in how they are
 * summarized.
 *
 * Read-only: selects only, no INSERT/UPDATE/DELETE. Results go to a JSON
 * file in the working directory.
 *
 *   npx tsx scripts/phase3-variance-compare.mts <evaluation-id> <phase2-json>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * ANTHROPIC_API_KEY_TEST — from the environment or from .env.local.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import {
  type EvalUsageTotals,
  billedInputTokens,
  computeEvalCostUsd,
  sumEvalUsage,
  usageFromResponse,
} from "../src/lib/evaluation/eval-cost";
import { buildSystemPrompt, buildUserMessage } from "../src/lib/evaluation/prompt";
import {
  CANONICAL_CRITERION_NAMES,
  submitSermonEvaluationTool,
} from "../src/lib/evaluation/tool-schema";
import { summarize } from "./phase2-variance.mts";

// ============================ KNOBS ============================

/** How many identical evaluations to run. Same as phase 2. */
const RUN_COUNT = 10;

/** Abort as soon as the running total passes this. Not a per-call limit. */
const COST_CEILING_USD = 6.0;

/** Set here, never inherited from EVALUATION_MODEL or getEvaluationModel(). */
const MODEL = "claude-opus-4-8";

/** Matches runEvaluation.ts so output tokens stay representative. */
const MAX_TOKENS = 16_000;

/** within-sd / corpus-sd at or above this counts as "more than half noise". */
const NOISE_THRESHOLD = 0.5;

/** Rows per page when sweeping the corpus. */
const CORPUS_PAGE_SIZE = 1000;

// ===============================================================

const CRITERION_COUNT = 11;

type RunRecord = {
  run: number;
  parsed: boolean;
  parse_error: string | null;
  stop_reason: string | null;
  scores: Record<number, number>;
  overall_score: number | null;
  usage: EvalUsageTotals;
  billed_input_tokens: number;
  cost_usd: number | null;
  running_total_usd: number;
};

type Stats = NonNullable<ReturnType<typeof summarize>>;

function loadEnvLocalIfPresent(): void {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

function usd(value: number): string {
  return `$${value.toFixed(6)}`;
}

function fixed(value: number | null | undefined, places = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return value.toFixed(places);
}

/** Scores out of a result payload, tolerant of a body that would fail Zod. */
function extractScores(payload: unknown): {
  scores: Record<number, number>;
  overallScore: number | null;
} {
  const scores: Record<number, number> = {};
  let overallScore: number | null = null;

  if (typeof payload !== "object" || payload === null) return { scores, overallScore };
  const root = payload as Record<string, unknown>;

  const scoring = root.scoring;
  if (typeof scoring === "object" && scoring !== null) {
    const weighted = (scoring as Record<string, unknown>).composite_weighted;
    if (typeof weighted === "number") overallScore = weighted;
  }

  const categories = root.categories;
  if (!Array.isArray(categories)) return { scores, overallScore };

  for (const category of categories) {
    if (typeof category !== "object" || category === null) continue;
    const criteria = (category as Record<string, unknown>).criteria;
    if (!Array.isArray(criteria)) continue;
    for (const criterion of criteria) {
      if (typeof criterion !== "object" || criterion === null) continue;
      const row = criterion as Record<string, unknown>;
      if (typeof row.id === "number" && typeof row.score === "number") {
        scores[row.id] = row.score;
      }
    }
  }

  return { scores, overallScore };
}

type ResolvedTarget = {
  evaluationId: string;
  versionId: string;
  title: string;
  primaryPassage: string | null;
  manuscript: string;
  recordedCriterionScores: Record<number, number>;
  recordedOverallScore: number | null;
};

/**
 * evaluation id -> version id -> manuscript. Three selects, no assumption
 * that any of those ids equals another.
 */
async function resolveTarget(
  supabase: SupabaseClient,
  evaluationId: string,
): Promise<ResolvedTarget> {
  const { data: evaluation, error: evaluationError } = await supabase
    .from("sermon_evaluations")
    .select("id, sermon_version_id, status, overall_score, result")
    .eq("id", evaluationId)
    .maybeSingle();
  if (evaluationError) throw new Error(evaluationError.message);
  if (!evaluation) throw new Error(`sermon_evaluations row not found: ${evaluationId}`);
  if (!evaluation.sermon_version_id) {
    throw new Error(`evaluation ${evaluationId} has no sermon_version_id`);
  }

  const versionId: string = evaluation.sermon_version_id;

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id, content")
    .eq("id", versionId)
    .maybeSingle();
  if (versionError) throw new Error(versionError.message);
  if (!version) throw new Error(`sermon_versions row not found: ${versionId}`);

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("id", version.sermon_id)
    .maybeSingle();
  if (sermonError) throw new Error(sermonError.message);
  if (!sermon) throw new Error(`sermons row not found for version ${versionId}`);

  const manuscript = typeof version.content === "string" ? version.content : "";
  if (!manuscript) throw new Error(`sermon version ${versionId} has empty content`);

  const recorded = extractScores(evaluation.result);

  return {
    evaluationId,
    versionId,
    title: sermon.title,
    primaryPassage: sermon.primary_passage,
    manuscript,
    recordedCriterionScores: recorded.scores,
    recordedOverallScore:
      recorded.overallScore ??
      (typeof evaluation.overall_score === "number" ? evaluation.overall_score : null),
  };
}

/**
 * Across-sermon spread per criterion, from every completed evaluation.
 * Computed with the same sampleStdDev the within-sermon figures use so the
 * ratio between them means something.
 */
async function corpusStdDevs(
  supabase: SupabaseClient,
): Promise<{ stats: Map<number, Stats>; overall: Stats | null; rowCount: number }> {
  const perCriterion = new Map<number, number[]>();
  const overallValues: number[] = [];
  let rowCount = 0;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("sermon_evaluations")
      .select("id, result")
      .eq("status", "complete")
      .not("result", "is", null)
      .order("id", { ascending: true })
      .range(from, from + CORPUS_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    for (const row of data) {
      rowCount += 1;
      const { scores, overallScore } = extractScores(row.result);
      for (const [id, score] of Object.entries(scores)) {
        const key = Number(id);
        const bucket = perCriterion.get(key) ?? [];
        bucket.push(score);
        perCriterion.set(key, bucket);
      }
      if (overallScore !== null) overallValues.push(overallScore);
    }

    if (data.length < CORPUS_PAGE_SIZE) break;
    from += CORPUS_PAGE_SIZE;
  }

  const stats = new Map<number, Stats>();
  for (let id = 1; id <= CRITERION_COUNT; id++) {
    const values = perCriterion.get(id) ?? [];
    const summary = summarize(`${id}. ${CANONICAL_CRITERION_NAMES[id - 1]}`, values);
    if (summary) stats.set(id, summary);
  }

  return {
    stats,
    overall: summarize("overall_score", overallValues),
    rowCount,
  };
}

/** within-sd per criterion id, out of a phase 2 / phase 3 results JSON. */
export function loadPriorSweep(path: string): {
  label: string;
  byCriterion: Map<number, number>;
  overall: number | null;
} {
  if (!existsSync(path)) throw new Error(`prior sweep JSON not found: ${path}`);
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`prior sweep JSON is not an object: ${path}`);
  }
  const root = parsed as Record<string, unknown>;

  const config = (root.config ?? {}) as Record<string, unknown>;
  const label =
    typeof config.sermon_title === "string" ? config.sermon_title : "prior sweep";

  const byCriterion = new Map<number, number>();
  const criterionStats = root.criterion_stats;
  if (!Array.isArray(criterionStats)) {
    throw new Error(`prior sweep JSON has no criterion_stats array: ${path}`);
  }
  for (const entry of criterionStats) {
    if (typeof entry !== "object" || entry === null) continue;
    const row = entry as Record<string, unknown>;
    // Labels are written as "<id>. <name>"; the id is the stable part.
    const id = Number(String(row.label ?? "").split(".")[0]);
    if (Number.isInteger(id) && typeof row.stddev_sample === "number") {
      byCriterion.set(id, row.stddev_sample);
    }
  }

  const overallStats = root.overall_stats;
  let overall: number | null = null;
  if (typeof overallStats === "object" && overallStats !== null) {
    const sd = (overallStats as Record<string, unknown>).stddev_sample;
    if (typeof sd === "number") overall = sd;
  }

  return { label, byCriterion, overall };
}

/**
 * A criterion is "noisy" when its within-sermon spread is at least half its
 * across-sermon spread: at that point most of what the score reports on one
 * sermon is resampling rather than the preacher. Stable on one sermon and
 * noisy on the other is the case the second sweep exists to detect, so it
 * gets its own verdict rather than being averaged away.
 */
export function classifyVerdict(
  ratioA: number | null,
  ratioB: number | null,
  threshold: number = NOISE_THRESHOLD,
): string {
  if (ratioA === null || ratioB === null) return "incomplete";
  const noisyA = ratioA >= threshold;
  const noisyB = ratioB >= threshold;
  if (noisyA && noisyB) return "VOLATILE on both";
  if (!noisyA && !noisyB) return "stable on both";
  return `FLIPS (${noisyA ? "noisy on A, stable on B" : "stable on A, noisy on B"})`;
}

function printSweepTable(criterionStats: Stats[], overallStats: Stats | null): void {
  console.log(
    "criterion".padEnd(38) +
      "n".padStart(3) +
      "min".padStart(5) +
      "max".padStart(5) +
      "rng".padStart(5) +
      "mode".padStart(8) +
      "mean".padStart(7) +
      "sd".padStart(7) +
      "  distribution",
  );
  console.log("-".repeat(110));

  const line = (s: Stats) => {
    const dist = Object.entries(s.distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([value, count]) => `${value}×${count}`)
      .join(" ");
    console.log(
      s.label.slice(0, 37).padEnd(38) +
        String(s.n).padStart(3) +
        String(s.min).padStart(5) +
        String(s.max).padStart(5) +
        String(s.range).padStart(5) +
        s.mode.join("/").padStart(8) +
        s.mean.toFixed(2).padStart(7) +
        fixed(s.stddev_sample).padStart(7) +
        "  " +
        dist,
    );
  };

  for (const s of criterionStats) line(s);
  if (overallStats) {
    console.log("-".repeat(110));
    line(overallStats);
  }
}

async function main(): Promise<void> {
  const evaluationId = process.argv[2];
  const priorSweepPath = process.argv[3];
  if (!evaluationId || !priorSweepPath) {
    throw new Error(
      "Usage: npx tsx scripts/phase3-variance-compare.mts <evaluation-id> <phase2-json>",
    );
  }

  loadEnvLocalIfPresent();

  // Test key -> the name the SDK reads, this process only. Never persisted.
  const apiKey = requireEnv("ANTHROPIC_API_KEY_TEST");
  process.env.ANTHROPIC_API_KEY = apiKey;

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const prior = loadPriorSweep(priorSweepPath);
  const target = await resolveTarget(supabase, evaluationId);

  console.log("=== PHASE 3 VARIANCE SWEEP ===");
  console.log(`evaluation:   ${target.evaluationId}`);
  console.log(`-> version:   ${target.versionId}   (resolved by select, not assumed)`);
  console.log(`title:        ${target.title}`);
  console.log(`passage:      ${target.primaryPassage ?? "(none recorded)"}`);
  console.log(`manuscript:   ${target.manuscript.length} chars`);
  console.log(
    `recorded:     criterion 1 = ${target.recordedCriterionScores[1] ?? "?"}, ` +
      `overall = ${target.recordedOverallScore ?? "?"}`,
  );
  console.log(`model:        ${MODEL} (set explicitly)`);
  console.log(`runs:         ${RUN_COUNT}`);
  console.log(`ceiling:      ${usd(COST_CEILING_USD)} on the running total`);
  console.log(`prior sweep:  ${prior.label}  (${priorSweepPath})`);
  console.log("");

  if (target.recordedCriterionScores[1] !== undefined) {
    console.log(
      `NOTE: this sermon's stored criterion 1 score is ${target.recordedCriterionScores[1]}. ` +
        "The sweep below is a fresh sample; the stored score is one prior draw, not ground truth.",
    );
    console.log("");
  }

  const system = buildSystemPrompt();
  const user = buildUserMessage({
    sermonTitle: target.title,
    manuscript: target.manuscript,
    primaryPassage: target.primaryPassage ?? undefined,
  });

  const client = new Anthropic({ apiKey });
  const runs: RunRecord[] = [];
  let runningTotal = 0;
  let aborted = false;
  let abortReason: string | null = null;

  for (let run = 1; run <= RUN_COUNT; run++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      tools: [submitSermonEvaluationTool],
      tool_choice: { type: "tool", name: submitSermonEvaluationTool.name },
    });

    const usage = usageFromResponse(response.usage);
    const cost = computeEvalCostUsd(response.model, usage);
    runningTotal += cost ?? 0;

    const toolUse = response.content.find((block) => block.type === "tool_use");
    let scores: Record<number, number> = {};
    let overallScore: number | null = null;
    let parseError: string | null = null;

    if (!toolUse) {
      parseError = `no tool_use block (stop_reason: ${response.stop_reason})`;
    } else {
      const extracted = extractScores(toolUse.input);
      scores = extracted.scores;
      overallScore = extracted.overallScore;
      if (Object.keys(scores).length !== CRITERION_COUNT) {
        parseError = `expected ${CRITERION_COUNT} criterion scores, got ${Object.keys(scores).length}`;
      }
    }

    runs.push({
      run,
      parsed: parseError === null,
      parse_error: parseError,
      stop_reason: response.stop_reason,
      scores,
      overall_score: overallScore,
      usage,
      billed_input_tokens: billedInputTokens(usage),
      cost_usd: cost,
      running_total_usd: runningTotal,
    });

    const scoreLine = Array.from(
      { length: CRITERION_COUNT },
      (_, i) => scores[i + 1] ?? "-",
    ).join(" ");
    console.log(
      `run ${String(run).padStart(2)}/${RUN_COUNT}  ` +
        `in ${String(usage.input_tokens).padStart(6)}  ` +
        `out ${String(usage.output_tokens).padStart(5)}  ` +
        `${usd(cost ?? 0)}  ` +
        `TOTAL ${usd(runningTotal)}  ` +
        `[${scoreLine}]  ` +
        `overall ${overallScore ?? "-"}` +
        (parseError ? `  !! ${parseError}` : ""),
    );

    if (run === 1) {
      console.log(
        `        projection: ${RUN_COUNT} runs at this rate = ${usd((cost ?? 0) * RUN_COUNT)}`,
      );
    }

    if (runningTotal > COST_CEILING_USD) {
      aborted = true;
      abortReason = `running total ${usd(runningTotal)} exceeded ceiling ${usd(COST_CEILING_USD)} after run ${run}`;
      console.log("");
      console.log(`!!! ABORTING: ${abortReason}`);
      break;
    }
  }

  // ---------------------- this sweep's statistics ----------------------

  const usable = runs.filter((r) => Object.keys(r.scores).length > 0);
  const criterionStats: Stats[] = [];
  const withinB = new Map<number, number>();

  for (let id = 1; id <= CRITERION_COUNT; id++) {
    const values = usable
      .map((r) => r.scores[id])
      .filter((v): v is number => typeof v === "number");
    const stats = summarize(`${id}. ${CANONICAL_CRITERION_NAMES[id - 1]}`, values);
    if (stats) {
      criterionStats.push(stats);
      withinB.set(id, stats.stddev_sample);
    }
  }

  const overallValues = runs
    .map((r) => r.overall_score)
    .filter((v): v is number => typeof v === "number");
  const overallStats = summarize("overall_score (composite_weighted /55)", overallValues);

  console.log("");
  console.log("=== PER-CRITERION SPREAD ACROSS IDENTICAL INPUT (this sermon) ===");
  printSweepTable(criterionStats, overallStats);

  // ---------------------- corpus + comparison ----------------------

  console.log("");
  console.log("Computing corpus standard deviation from completed evaluations...");
  const corpus = await corpusStdDevs(supabase);
  console.log(`corpus rows: ${corpus.rowCount}`);

  console.log("");
  console.log("=== CROSS-SERMON COMPARISON ===");
  console.log(`A = ${prior.label}`);
  console.log(`B = ${target.title}`);
  console.log(
    `ratio = within-sd / corpus-sd. At or above ${NOISE_THRESHOLD.toFixed(2)} the criterion carries more noise than signal.`,
  );
  console.log("");
  console.log(
    "criterion".padEnd(34) +
      "sdA".padStart(7) +
      "sdB".padStart(7) +
      "corpus".padStart(8) +
      "ratioA".padStart(8) +
      "ratioB".padStart(8) +
      "  verdict",
  );
  console.log("-".repeat(100));

  type ComparisonRow = {
    id: number;
    name: string;
    within_sd_a: number | null;
    within_sd_b: number | null;
    corpus_sd: number | null;
    ratio_a: number | null;
    ratio_b: number | null;
    verdict: string;
  };
  const comparison: ComparisonRow[] = [];

  for (let id = 1; id <= CRITERION_COUNT; id++) {
    const sdA = prior.byCriterion.get(id) ?? null;
    const sdB = withinB.get(id) ?? null;
    const corpusSd = corpus.stats.get(id)?.stddev_sample ?? null;

    const ratio = (sd: number | null): number | null =>
      sd === null || corpusSd === null || corpusSd === 0 || Number.isNaN(sd)
        ? null
        : sd / corpusSd;

    const ratioA = ratio(sdA);
    const ratioB = ratio(sdB);

    const verdict = classifyVerdict(ratioA, ratioB);

    const name = CANONICAL_CRITERION_NAMES[id - 1];
    comparison.push({
      id,
      name,
      within_sd_a: sdA,
      within_sd_b: sdB,
      corpus_sd: corpusSd,
      ratio_a: ratioA,
      ratio_b: ratioB,
      verdict,
    });

    console.log(
      `${id}. ${name}`.slice(0, 33).padEnd(34) +
        fixed(sdA).padStart(7) +
        fixed(sdB).padStart(7) +
        fixed(corpusSd).padStart(8) +
        fixed(ratioA).padStart(8) +
        fixed(ratioB).padStart(8) +
        "  " +
        verdict,
    );
  }

  const overallCorpusSd = corpus.overall?.stddev_sample ?? null;
  console.log("-".repeat(100));
  console.log(
    "overall_score".padEnd(34) +
      fixed(prior.overall).padStart(7) +
      fixed(overallStats?.stddev_sample ?? null).padStart(7) +
      fixed(overallCorpusSd).padStart(8) +
      "".padStart(8) +
      "".padStart(8),
  );

  console.log("");
  console.log("=== SUMMARY ===");
  const stableBoth = comparison.filter((r) => r.verdict === "stable on both");
  const volatileBoth = comparison.filter((r) => r.verdict === "VOLATILE on both");
  const flips = comparison.filter((r) => r.verdict.startsWith("FLIPS"));
  console.log(
    `stable on both:   ${stableBoth.length}  [${stableBoth.map((r) => r.id).join(", ") || "none"}]`,
  );
  console.log(
    `volatile on both: ${volatileBoth.length}  [${volatileBoth.map((r) => r.id).join(", ") || "none"}]`,
  );
  console.log(
    `flips:            ${flips.length}  [${flips.map((r) => r.id).join(", ") || "none"}]`,
  );

  const c1 = comparison.find((r) => r.id === 1);
  if (c1) {
    console.log("");
    console.log(
      `criterion 1: sdA ${fixed(c1.within_sd_a)}, sdB ${fixed(c1.within_sd_b)}, ` +
        `corpus ${fixed(c1.corpus_sd)} -> ${c1.verdict}`,
    );
  }

  const totalUsage = sumEvalUsage(runs.map((r) => r.usage));

  console.log("");
  console.log("=== TOTALS ===");
  console.log(`runs completed:        ${runs.length} of ${RUN_COUNT}`);
  console.log(`runs fully parsed:     ${runs.filter((r) => r.parsed).length}`);
  console.log(`total billed input:    ${billedInputTokens(totalUsage)}`);
  console.log(`total output tokens:   ${totalUsage.output_tokens}`);
  console.log(`TOTAL COST:            ${usd(runningTotal)}`);
  console.log(
    `ceiling:               ${usd(COST_CEILING_USD)}${aborted ? " — EXCEEDED" : " — not reached"}`,
  );

  const outPath = join(
    process.cwd(),
    `phase3-variance-${target.versionId.slice(0, 8)}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        config: {
          evaluation_id: target.evaluationId,
          version_id: target.versionId,
          sermon_title: target.title,
          primary_passage: target.primaryPassage,
          manuscript_chars: target.manuscript.length,
          recorded_criterion_scores: target.recordedCriterionScores,
          recorded_overall_score: target.recordedOverallScore,
          model: MODEL,
          max_tokens: MAX_TOKENS,
          run_count: RUN_COUNT,
          cost_ceiling_usd: COST_CEILING_USD,
          noise_threshold: NOISE_THRESHOLD,
          prior_sweep_path: priorSweepPath,
          prior_sweep_label: prior.label,
          corpus_rows: corpus.rowCount,
          generated_at: new Date().toISOString(),
        },
        aborted,
        abort_reason: abortReason,
        total_cost_usd: runningTotal,
        total_usage: totalUsage,
        criterion_stats: criterionStats,
        overall_stats: overallStats,
        comparison,
        corpus_stats: [...corpus.stats.values()],
        corpus_overall: corpus.overall,
        runs,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log("");
  console.log(`results written to: ${outPath}`);
  console.log("Done.");
}

/* Only run when executed directly. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
