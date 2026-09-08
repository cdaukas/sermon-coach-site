/**
 * PHASE 2 VARIANCE SWEEP — N identical evaluations of one manuscript.
 *
 * Measures how much a criterion score moves when nothing about the input
 * moves. Spread on identical input is noise, and a per-criterion constant
 * derived from a distribution that wide is measuring the collapse rather
 * than the preacher.
 *
 * Same single-shot path as phase1-cost-gate.mts, for the same reason:
 * runEvaluation() retries once on a schema-validation failure and would
 * bill two calls for one run, which would corrupt both the cost total and
 * the sample (the retry is a second draw, not the same draw).
 *
 * Sampling is left at the API default, and no cache_control is set — both
 * to match phase 1 exactly, so its measured per-call cost stays a valid
 * baseline. Caching would make per-run cost non-uniform for no gain here.
 *
 * Read-only against the database: two SELECTs before the loop, no
 * INSERT/UPDATE/DELETE. Results go to a JSON file in the working directory.
 *
 *   npx tsx scripts/phase2-variance.mts <sermon-version-id>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * ANTHROPIC_API_KEY_TEST — from the environment or from .env.local.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
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

// ============================ KNOBS ============================

/** How many identical evaluations to run. */
const RUN_COUNT = 10;

/** Abort as soon as the running total passes this. Not a per-call limit. */
const COST_CEILING_USD = 6.0;

/** Set here, never inherited from EVALUATION_MODEL or getEvaluationModel(). */
const MODEL = "claude-opus-4-8";

/** Matches runEvaluation.ts so output tokens stay representative. */
const MAX_TOKENS = 16_000;

/** Phase 1's measured single-call cost, for the projection after run 1. */
const PHASE1_BASELINE_USD = 0.371915;

// ===============================================================

const CRITERION_COUNT = 11;

type RunRecord = {
  run: number;
  parsed: boolean;
  parse_error: string | null;
  stop_reason: string | null;
  /** criterion id (1-11) -> score (1-5). Empty when the run did not parse. */
  scores: Record<number, number>;
  overall_score: number | null;
  usage: EvalUsageTotals;
  billed_input_tokens: number;
  cost_usd: number | null;
  running_total_usd: number;
};

type Stats = {
  label: string;
  n: number;
  min: number;
  max: number;
  range: number;
  mode: number[];
  mean: number;
  stddev_sample: number;
  /** value -> how many runs produced it. */
  distribution: Record<string, number>;
};

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

/**
 * Sample standard deviation (n-1). These runs are a sample of the model's
 * output distribution, not the whole of it, so the n-1 denominator is the
 * right one. Undefined for n < 2.
 */
export function sampleStdDev(values: number[]): number {
  if (values.length < 2) return Number.NaN;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sumSq = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

/** Every value tied for most frequent, ascending. Multimodal is real here. */
export function modes(values: number[]): number[] {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(...counts.values());
  return [...counts.entries()]
    .filter(([, count]) => count === top)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function summarize(label: string, values: number[]): Stats | null {
  if (values.length === 0) return null;
  const distribution: Record<string, number> = {};
  for (const v of values) {
    const key = String(v);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }
  return {
    label,
    n: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    range: Math.max(...values) - Math.min(...values),
    mode: modes(values),
    mean: values.reduce((sum, v) => sum + v, 0) / values.length,
    stddev_sample: sampleStdDev(values),
    distribution,
  };
}

type LoadedVersion = {
  title: string;
  primaryPassage: string | null;
  manuscript: string;
};

/** Two SELECTs, run once before the loop. Nothing here writes. */
async function loadVersion(versionId: string): Promise<LoadedVersion> {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

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

  return { title: sermon.title, primaryPassage: sermon.primary_passage, manuscript };
}

/**
 * Pull scores out of the tool payload without running the strict Zod schema.
 * A schema failure would discard an otherwise usable draw, and a run that
 * scores every criterion is data whether or not the rest of the payload
 * validates. Anything genuinely unreadable is recorded as unparsed instead.
 */
function extractScores(toolInput: unknown): {
  scores: Record<number, number>;
  overallScore: number | null;
} {
  const scores: Record<number, number> = {};
  let overallScore: number | null = null;

  if (typeof toolInput !== "object" || toolInput === null) {
    return { scores, overallScore };
  }
  const root = toolInput as Record<string, unknown>;

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

async function main(): Promise<void> {
  const versionId = process.argv[2];
  if (!versionId) {
    throw new Error("Usage: npx tsx scripts/phase2-variance.mts <sermon-version-id>");
  }

  loadEnvLocalIfPresent();

  // Test key -> the name the SDK reads, this process only. Never persisted.
  const apiKey = requireEnv("ANTHROPIC_API_KEY_TEST");
  process.env.ANTHROPIC_API_KEY = apiKey;

  const loaded = await loadVersion(versionId);
  const system = buildSystemPrompt();
  const user = buildUserMessage({
    sermonTitle: loaded.title,
    manuscript: loaded.manuscript,
    primaryPassage: loaded.primaryPassage ?? undefined,
  });

  console.log("=== PHASE 2 VARIANCE SWEEP ===");
  console.log(`version:      ${versionId}`);
  console.log(`title:        ${loaded.title}`);
  console.log(`manuscript:   ${loaded.manuscript.length} chars`);
  console.log(`model:        ${MODEL} (set explicitly)`);
  console.log(`runs:         ${RUN_COUNT}`);
  console.log(`ceiling:      ${usd(COST_CEILING_USD)} on the running total`);
  console.log(`phase 1 was:  ${usd(PHASE1_BASELINE_USD)} for one call`);
  console.log("");

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

  // ---------------------- statistics ----------------------

  const usable = runs.filter((r) => Object.keys(r.scores).length > 0);
  const criterionStats: Stats[] = [];

  for (let id = 1; id <= CRITERION_COUNT; id++) {
    const values = usable
      .map((r) => r.scores[id])
      .filter((v): v is number => typeof v === "number");
    const stats = summarize(`${id}. ${CANONICAL_CRITERION_NAMES[id - 1]}`, values);
    if (stats) criterionStats.push(stats);
  }

  const overallValues = runs
    .map((r) => r.overall_score)
    .filter((v): v is number => typeof v === "number");
  const overallStats = summarize("overall_score (composite_weighted /55)", overallValues);

  console.log("");
  console.log("=== PER-CRITERION SPREAD ACROSS IDENTICAL INPUT ===");
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

  for (const s of criterionStats) {
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
        (Number.isNaN(s.stddev_sample) ? "n/a" : s.stddev_sample.toFixed(3)).padStart(7) +
        "  " +
        dist,
    );
  }

  if (overallStats) {
    console.log("-".repeat(110));
    const dist = Object.entries(overallStats.distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([value, count]) => `${value}×${count}`)
      .join(" ");
    console.log(
      overallStats.label.slice(0, 37).padEnd(38) +
        String(overallStats.n).padStart(3) +
        String(overallStats.min).padStart(5) +
        String(overallStats.max).padStart(5) +
        String(overallStats.range).padStart(5) +
        overallStats.mode.join("/").padStart(8) +
        overallStats.mean.toFixed(2).padStart(7) +
        (Number.isNaN(overallStats.stddev_sample)
          ? "n/a"
          : overallStats.stddev_sample.toFixed(3)
        ).padStart(7) +
        "  " +
        dist,
    );
  }

  const totalUsage = sumEvalUsage(runs.map((r) => r.usage));

  console.log("");
  console.log("=== TOTALS ===");
  console.log(`runs completed:        ${runs.length} of ${RUN_COUNT}`);
  console.log(`runs fully parsed:     ${runs.filter((r) => r.parsed).length}`);
  console.log(`total input tokens:    ${totalUsage.input_tokens}`);
  console.log(`total billed input:    ${billedInputTokens(totalUsage)}`);
  console.log(`total output tokens:   ${totalUsage.output_tokens}`);
  console.log(`TOTAL COST:            ${usd(runningTotal)}`);
  console.log(`ceiling:               ${usd(COST_CEILING_USD)}${aborted ? " — EXCEEDED" : " — not reached"}`);

  const outPath = join(
    process.cwd(),
    `phase2-variance-${versionId.slice(0, 8)}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        config: {
          version_id: versionId,
          sermon_title: loaded.title,
          manuscript_chars: loaded.manuscript.length,
          model: MODEL,
          max_tokens: MAX_TOKENS,
          run_count: RUN_COUNT,
          cost_ceiling_usd: COST_CEILING_USD,
          phase1_baseline_usd: PHASE1_BASELINE_USD,
          generated_at: new Date().toISOString(),
        },
        aborted,
        abort_reason: abortReason,
        total_cost_usd: runningTotal,
        total_usage: totalUsage,
        criterion_stats: criterionStats,
        overall_stats: overallStats,
        runs,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log("");
  console.log(`results written to: ${outPath}`);
  console.log("Done. No phase 3.");
}

/* Only run when executed directly, so the stats helpers above can be
   imported and tested without firing ten API calls. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
