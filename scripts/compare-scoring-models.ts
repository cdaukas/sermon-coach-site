/**
 * One-off: compare scoring models on one existing sermon version.
 *
 * Six scoring-only passes (prompt v3.5): 3 × claude-sonnet-4-6, 3 × claude-opus-4-8.
 * Does not insert into sermon_evaluations. Does not change EVALUATION_MODEL in
 * any env file. Overrides the model per runEvaluation call.
 *
 * Usage:
 *   npx tsx scripts/compare-scoring-models.ts <sermon-version-id>
 *   npx tsx scripts/compare-scoring-models.ts <sermon-version-id> --estimate-only
 *   npx tsx scripts/compare-scoring-models.ts <sermon-version-id> --force
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { computeEvalCostUsd } from "../src/lib/evaluation/eval-cost";
import {
  EVALUATION_PROMPT_VERSION,
  buildSystemPrompt,
  buildUserMessage,
} from "../src/lib/evaluation/prompt";
import { runEvaluation } from "../src/lib/evaluation/runEvaluation";
import {
  CATEGORY_MAX_POINTS,
  categorySubtotal,
  type EvaluationResultStrict,
} from "../src/lib/evaluation/schema";
import { formatDisplayScoreBare } from "../src/lib/evaluation/display-score";
import { submitSermonEvaluationTool } from "../src/lib/evaluation/tool-schema";

const MODELS = ["claude-sonnet-4-6", "claude-opus-4-8"] as const;
const RUNS_PER_MODEL = 3;
const ESTIMATED_OUTPUT_TOKENS = 10_000;
const CHARS_PER_TOKEN = 4;
/** Abort when the pre-run estimate is more than 50% above Chris's ~$2.40. */
const COST_ABORT_USD = 3.6;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ModelId = (typeof MODELS)[number];

type LoadedVersion = {
  versionId: string;
  sermonId: string;
  title: string;
  primaryPassage: string | null;
  manuscript: string;
};

type RunRecord = {
  model: ModelId;
  run: number;
  weighted_55: number;
  display_10: number;
  category_subtotals: Array<{
    number: number;
    name: string;
    subtotal: number;
    max: number;
  }>;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  api_model: string;
  melodic_line_and_big_idea: EvaluationResultStrict["melodic_line_and_big_idea"];
  criterion_1_narrative: string | null;
  result: EvaluationResultStrict;
};

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

function parseArgs(argv: string[]): {
  versionId: string;
  estimateOnly: boolean;
  force: boolean;
} {
  const tokens = argv.slice(2);
  let estimateOnly = false;
  let force = false;
  const positional: string[] = [];

  for (const token of tokens) {
    if (token === "--estimate-only") {
      estimateOnly = true;
      continue;
    }
    if (token === "--force") {
      force = true;
      continue;
    }
    if (token.startsWith("-")) {
      console.error(`Unknown flag: ${token}`);
      process.exit(1);
    }
    positional.push(token);
  }

  const versionId = positional[0]?.trim() ?? "";
  if (!versionId || !UUID_RE.test(versionId)) {
    console.error(
      "Usage: npx tsx scripts/compare-scoring-models.ts <sermon-version-id> [--estimate-only] [--force]",
    );
    process.exit(1);
  }

  return { versionId, estimateOnly, force };
}

function estimateInputTokens(manuscriptInput: {
  sermonTitle: string;
  manuscript: string;
  primaryPassage?: string;
}): number {
  const system = buildSystemPrompt();
  const user = buildUserMessage(manuscriptInput);
  const tools = JSON.stringify(submitSermonEvaluationTool);
  return Math.ceil((system.length + user.length + tools.length) / CHARS_PER_TOKEN);
}

function estimateCostUsd(model: string, inputTokens: number): number | null {
  return computeEvalCostUsd(model, {
    input_tokens: inputTokens,
    output_tokens: ESTIMATED_OUTPUT_TOKENS,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  });
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function padLeft(value: string, width: number): string {
  return value.length >= width ? value : " ".repeat(width - value.length) + value;
}

function mean(values: number[]): number {
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function criterion1Narrative(result: EvaluationResultStrict): string | null {
  for (const category of result.categories) {
    const criterion = category.criteria.find((item) => item.id === 1);
    if (criterion) {
      return criterion.narrative;
    }
  }
  return null;
}

function categoryRows(result: EvaluationResultStrict): RunRecord["category_subtotals"] {
  return result.categories.map((category) => ({
    number: category.number,
    name: category.name,
    subtotal: categorySubtotal(category.criteria),
    max: CATEGORY_MAX_POINTS[category.number] ?? category.criteria.length * 5,
  }));
}

function printTable(runs: RunRecord[]): void {
  const headers = [
    pad("model", 20),
    padLeft("run", 3),
    padLeft("/55", 5),
    padLeft("/10", 5),
    padLeft("cat1", 6),
    padLeft("cat2", 6),
    padLeft("cat3", 6),
    padLeft("cat4", 6),
  ];
  console.log(headers.join("  "));
  console.log("-".repeat(70));

  for (const run of runs) {
    const cats = [1, 2, 3, 4].map((number) => {
      const row = run.category_subtotals.find((c) => c.number === number);
      if (!row) return padLeft("—", 6);
      return padLeft(`${row.subtotal}/${row.max}`, 6);
    });
    console.log(
      [
        pad(run.model, 20),
        padLeft(String(run.run), 3),
        padLeft(String(run.weighted_55), 5),
        padLeft(formatDisplayScoreBare(run.weighted_55), 5),
        ...cats,
      ].join("  "),
    );
  }
}

function printSummaries(runs: RunRecord[]): void {
  console.log("");
  console.log("Per-model /55 summary");
  console.log("-".repeat(40));
  for (const model of MODELS) {
    const scores = runs
      .filter((run) => run.model === model)
      .map((run) => run.weighted_55);
    if (scores.length === 0) continue;
    const avg = mean(scores);
    console.log(
      `${pad(model, 20)}  min ${Math.min(...scores)}  max ${Math.max(...scores)}  mean ${avg.toFixed(1)}`,
    );
  }
}

function printRun1Prose(runs: RunRecord[]): void {
  for (const model of MODELS) {
    const first = runs.find((run) => run.model === model && run.run === 1);
    if (!first) continue;

    console.log("");
    console.log("=".repeat(72));
    console.log(`${model} · run 1 · melodic line display block`);
    console.log("=".repeat(72));
    const block = first.melodic_line_and_big_idea;
    if (!block) {
      console.log("(missing melodic_line_and_big_idea)");
    } else {
      console.log(`Book: ${block.book}`);
      console.log("");
      console.log(`Passage: ${block.passage}`);
      console.log("");
      console.log(`Melodic line: ${block.melodic_line}`);
    }

    console.log("");
    console.log("=".repeat(72));
    console.log(`${model} · run 1 · criterion 1 narrative`);
    console.log("=".repeat(72));
    console.log(first.criterion_1_narrative ?? "(missing criterion 1 narrative)");
  }
}

async function loadVersion(versionId: string): Promise<LoadedVersion> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id, content")
    .eq("id", versionId)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }
  if (!version) {
    throw new Error(`sermon_versions row not found: ${versionId}`);
  }

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError) {
    throw new Error(sermonError.message);
  }
  if (!sermon) {
    throw new Error(`sermons row not found for version ${versionId}`);
  }

  const manuscript = typeof version.content === "string" ? version.content : "";
  if (!manuscript) {
    throw new Error(`sermon version ${versionId} has empty content`);
  }

  return {
    versionId: version.id,
    sermonId: sermon.id,
    title: sermon.title,
    primaryPassage: sermon.primary_passage,
    manuscript,
  };
}

async function main(): Promise<void> {
  const { versionId, estimateOnly, force } = parseArgs(process.argv);
  loadEnvLocalIfPresent();
  requireEnv("ANTHROPIC_API_KEY");

  const loaded = await loadVersion(versionId);
  const manuscriptSha = createHash("sha256")
    .update(loaded.manuscript, "utf8")
    .digest("hex");
  const userInput = {
    sermonTitle: loaded.title,
    manuscript: loaded.manuscript,
    ...(loaded.primaryPassage ? { primaryPassage: loaded.primaryPassage } : {}),
  };
  const estimatedInputTokens = estimateInputTokens(userInput);

  const perModelEstimates = MODELS.map((model) => ({
    model,
    cost: estimateCostUsd(model, estimatedInputTokens),
  }));
  const totalEstimate = perModelEstimates.reduce((sum, row) => {
    if (row.cost == null) return sum;
    return sum + row.cost * RUNS_PER_MODEL;
  }, 0);

  console.log("Scoring-model compare (no DB insert)");
  console.log(`Prompt version: ${EVALUATION_PROMPT_VERSION}`);
  console.log(`Sermon: ${loaded.title}`);
  console.log(`Passage: ${loaded.primaryPassage ?? "(none)"}`);
  console.log(`Sermon id: ${loaded.sermonId}`);
  console.log(`Version id: ${loaded.versionId}`);
  console.log(`Manuscript: ${loaded.manuscript.length} chars, sha256 ${manuscriptSha}`);
  console.log("Context: none (not stored on the version row; same across all six runs)");
  console.log(
    `Estimated input tokens: ~${estimatedInputTokens} (chars/4, includes system + tool schema + user)`,
  );
  console.log(`Estimated output tokens per call: ${ESTIMATED_OUTPUT_TOKENS}`);
  console.log("");
  console.log("Estimated API cost (scoring only; no HIP, no Haiku verdict lines, no coaching):");
  for (const row of perModelEstimates) {
    const each = row.cost == null ? "unknown" : `$${row.cost.toFixed(2)}`;
    const three =
      row.cost == null ? "unknown" : `$${(row.cost * RUNS_PER_MODEL).toFixed(2)}`;
    console.log(`  ${row.model}: ${each} × ${RUNS_PER_MODEL} = ${three}`);
  }
  console.log(`  Total: ~$${totalEstimate.toFixed(2)}`);
  console.log(
    "  Schema retry (once per failed call) is not included; a retry would roughly double that run.",
  );

  if (totalEstimate > COST_ABORT_USD && !force) {
    console.error("");
    console.error(
      `Estimate $${totalEstimate.toFixed(2)} is materially above ~$2.40. Stopping. Re-run with --force if you still want it.`,
    );
    process.exit(2);
  }

  if (estimateOnly) {
    console.log("");
    console.log("--estimate-only: not calling the API.");
    return;
  }

  const runs: RunRecord[] = [];
  let actualCost = 0;

  for (const model of MODELS) {
    for (let run = 1; run <= RUNS_PER_MODEL; run++) {
      console.log("");
      console.log(`Running ${model} · ${run}/${RUNS_PER_MODEL}…`);
      const started = Date.now();
      const { result, model: apiModel, inputTokens, outputTokens } =
        await runEvaluation(userInput, { model });
      const elapsedMs = Date.now() - started;
      const cost = computeEvalCostUsd(model, {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      });
      if (cost != null) {
        actualCost += cost;
      }

      const record: RunRecord = {
        model,
        run,
        weighted_55: result.scoring.composite_weighted,
        display_10: Number(formatDisplayScoreBare(result.scoring.composite_weighted)),
        category_subtotals: categoryRows(result),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        api_model: apiModel,
        melodic_line_and_big_idea: result.melodic_line_and_big_idea ?? null,
        criterion_1_narrative: criterion1Narrative(result),
        result,
      };
      runs.push(record);
      console.log(
        `  ${record.weighted_55}/55 (${formatDisplayScoreBare(record.weighted_55)}/10)  tokens ${inputTokens}/${outputTokens}  cost ${cost == null ? "unknown" : `$${cost.toFixed(2)}`}  ${elapsedMs}ms`,
      );
    }
  }

  console.log("");
  printTable(runs);
  printSummaries(runs);
  printRun1Prose(runs);

  const outDir = join(process.cwd(), ".tmp-verify");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(
    outDir,
    `scoring-model-compare-${loaded.versionId.slice(0, 8)}-${stamp}.json`,
  );
  const payload = {
    prompt_version: EVALUATION_PROMPT_VERSION,
    sermon_version_id: loaded.versionId,
    sermon_id: loaded.sermonId,
    title: loaded.title,
    primary_passage: loaded.primaryPassage,
    manuscript_sha256: manuscriptSha,
    manuscript_chars: loaded.manuscript.length,
    estimated_cost_usd: Number(totalEstimate.toFixed(4)),
    actual_cost_usd: Number(actualCost.toFixed(4)),
    runs,
    summaries: Object.fromEntries(
      MODELS.map((model) => {
        const scores = runs
          .filter((run) => run.model === model)
          .map((run) => run.weighted_55);
        return [
          model,
          {
            min: Math.min(...scores),
            max: Math.max(...scores),
            mean: Number(mean(scores).toFixed(2)),
          },
        ];
      }),
    ),
  };
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`Wrote ${outPath}`);
  console.log(`Actual API cost: $${actualCost.toFixed(2)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
