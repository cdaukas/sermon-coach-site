/**
 * PHASE 1 COST GATE — exactly one evaluation call, then exit.
 *
 * Measures what a single evaluation actually costs, so the run count for any
 * larger sweep is chosen against a real number rather than an estimate.
 *
 * Deliberately does NOT call runEvaluation(). That function retries once on a
 * schema-validation failure (runEvaluation.ts, `for (let attempt = 0; attempt < 2)`)
 * and sums both attempts into one usage total, so a single invocation can bill
 * two calls. This issues one client.messages.create and reports what comes back,
 * schema-valid or not — the tokens are billed either way, which is the point.
 *
 * Read-only against the database: two SELECTs, no INSERT/UPDATE/DELETE.
 * Writes nothing to sermon_evaluations, sermon_versions, or sermons.
 *
 *   npx tsx scripts/phase1-cost-gate.mts <sermon-version-id>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * ANTHROPIC_API_KEY_TEST — from the environment or from .env.local.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  billedInputTokens,
  computeEvalCostUsd,
  ratesForModel,
  usageFromResponse,
} from "../src/lib/evaluation/eval-cost";
import { buildSystemPrompt, buildUserMessage } from "../src/lib/evaluation/prompt";
import { submitSermonEvaluationTool } from "../src/lib/evaluation/tool-schema";

/**
 * Set here, never read from EVALUATION_MODEL or getEvaluationModel(). The
 * measured number has to be attributable to a named model, and a fallback
 * that silently changed would invalidate it.
 */
const MODEL = "claude-opus-4-8";

/** Matches runEvaluation.ts so the output tokens are representative. */
const MAX_TOKENS = 16_000;

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

type LoadedVersion = {
  title: string;
  primaryPassage: string | null;
  manuscript: string;
};

/** Two SELECTs. Nothing here writes. */
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

  return {
    title: sermon.title,
    primaryPassage: sermon.primary_passage,
    manuscript,
  };
}

async function main(): Promise<void> {
  const versionId = process.argv[2];
  if (!versionId) {
    throw new Error("Usage: npx tsx scripts/phase1-cost-gate.mts <sermon-version-id>");
  }

  loadEnvLocalIfPresent();

  // The test key, mapped to the name the SDK reads, for this process only.
  // Never written to disk and never exported to a parent shell.
  const apiKey = requireEnv("ANTHROPIC_API_KEY_TEST");
  process.env.ANTHROPIC_API_KEY = apiKey;

  const loaded = await loadVersion(versionId);

  const system = buildSystemPrompt();
  const user = buildUserMessage({
    sermonTitle: loaded.title,
    manuscript: loaded.manuscript,
    primaryPassage: loaded.primaryPassage ?? undefined,
  });

  console.log("=== PHASE 1 COST GATE ===");
  console.log(`version:     ${versionId}`);
  console.log(`title:       ${loaded.title}`);
  console.log(`manuscript:  ${loaded.manuscript.length} chars`);
  console.log(`model:       ${MODEL} (set explicitly, not inherited)`);
  console.log(`max_tokens:  ${MAX_TOKENS}`);
  console.log("");
  console.log("Making exactly 1 API call. No retry, no loop.");
  console.log("");

  const client = new Anthropic({ apiKey });

  // ----------------------- THE ONE CALL -----------------------
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
    tools: [submitSermonEvaluationTool],
    tool_choice: { type: "tool", name: submitSermonEvaluationTool.name },
  });
  // ------------------------------------------------------------

  const usage = usageFromResponse(response.usage);
  const billedIn = billedInputTokens(usage);
  const cost = computeEvalCostUsd(response.model, usage);
  const rates = ratesForModel(response.model);

  console.log("=== TOKENS (raw, from response.usage) ===");
  console.log(`input_tokens                  ${usage.input_tokens}`);
  console.log(`cache_creation_input_tokens   ${usage.cache_creation_input_tokens}`);
  console.log(`cache_read_input_tokens       ${usage.cache_read_input_tokens}`);
  console.log(`BILLED INPUT (sum of above)   ${billedIn}`);
  console.log(`output_tokens                 ${usage.output_tokens}`);
  console.log("");
  console.log(`stop_reason                   ${response.stop_reason}`);
  console.log(`response.model                ${response.model}`);
  console.log("");

  if (!rates) {
    console.log("=== NO RATE ENTRY ===");
    console.log(`eval-cost.ts has no rates for "${response.model}". Cost is null.`);
    console.log("Token counts above are still exact. Price them by hand.");
    process.exit(0);
  }

  const inputCost = (usage.input_tokens / 1_000_000) * rates.input;
  const outputCost = (usage.output_tokens / 1_000_000) * rates.output;
  const cacheWriteCost =
    usage.cache_creation_input_tokens > 0 && rates.cache_write != null
      ? (usage.cache_creation_input_tokens / 1_000_000) * rates.cache_write
      : 0;
  const cacheReadCost =
    usage.cache_read_input_tokens > 0 && rates.cache_read != null
      ? (usage.cache_read_input_tokens / 1_000_000) * rates.cache_read
      : 0;

  console.log("=== RATES APPLIED (USD per million tokens) ===");
  console.log(`input        $${rates.input}`);
  console.log(`output       $${rates.output}`);
  console.log(`cache_write  $${rates.cache_write ?? "n/a"}`);
  console.log(`cache_read   $${rates.cache_read ?? "n/a"}`);
  console.log("");

  console.log("=== ARITHMETIC (check by hand) ===");
  console.log(
    `input        ${usage.input_tokens} / 1e6 * ${rates.input} = ${usd(inputCost)}`,
  );
  console.log(
    `cache write  ${usage.cache_creation_input_tokens} / 1e6 * ${rates.cache_write ?? 0} = ${usd(cacheWriteCost)}`,
  );
  console.log(
    `cache read   ${usage.cache_read_input_tokens} / 1e6 * ${rates.cache_read ?? 0} = ${usd(cacheReadCost)}`,
  );
  console.log(
    `output       ${usage.output_tokens} / 1e6 * ${rates.output} = ${usd(outputCost)}`,
  );
  console.log(
    `                                     sum = ${usd(inputCost + cacheWriteCost + cacheReadCost + outputCost)}`,
  );
  console.log("");
  console.log(`computeEvalCostUsd() returned    ${cost === null ? "null" : usd(cost)}`);
  console.log("");
  console.log(`COST OF THIS ONE CALL: ${cost === null ? "null" : usd(cost)}`);
  console.log("");
  console.log("Phase 1 complete. Exiting. No loop, no phase 2.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
