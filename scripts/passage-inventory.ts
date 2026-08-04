/**
 * Generate and store a passage inventory offline.
 *
 * Writes ONLY to passage_inventories. Does not touch the evaluation path.
 * Strict primary_passage only — never falls back to result.meta.scripture_reference.
 *
 * Usage:
 *   npm run passage:inventory -- --passage="Hebrews 3:1-6"
 *   npm run passage:inventory -- --evaluation-id=<uuid>
 *   npm run passage:inventory -- --all-unindexed
 *   npm run passage:inventory -- --all-unindexed --dry-run
 *   npm run passage:inventory -- --passage="Hebrews 3:1-6" --force
 *
 * Skip audit (field quality):
 *   output/passage-diff/skipped.csv
 *   columns: sermon_id, evaluation_id, primary_passage_raw, skip_reason
 *
 * Env: ANTHROPIC_API_KEY (not required with --dry-run),
 *      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildInventorySystemPrompt,
  buildInventoryUserMessage,
} from "../src/lib/passage/inventory-prompt";
import {
  PASSAGE_INVENTORY_MODEL,
  PASSAGE_INVENTORY_PROMPT_VERSION,
  passageInventoryFieldsSchema,
  type PassageInventoryFields,
} from "../src/lib/passage/inventory-schema";
import { normalizePassageRef } from "../src/lib/passage/normalize";
import {
  createServiceClient,
  loadEnvLocalIfPresent,
  parseFlag,
  parseJsonObject,
  parseOption,
  requireEnv,
} from "./lib/script-env";

const SKIP_CSV_DIR = join(process.cwd(), "output", "passage-diff");
const SKIP_CSV_PATH = join(SKIP_CSV_DIR, "skipped.csv");
const SKIP_CSV_HEADER =
  "sermon_id,evaluation_id,primary_passage_raw,skip_reason";

type Mode =
  | { kind: "passage"; raw: string }
  | { kind: "evaluation"; id: string }
  | { kind: "all-unindexed" };

type SkipRow = {
  sermon_id: string;
  evaluation_id: string;
  primary_passage_raw: string;
  skip_reason: string;
};

function usage(): never {
  console.error(`Usage:
  npm run passage:inventory -- --passage="Hebrews 3:1-6"
  npm run passage:inventory -- --evaluation-id=<uuid>
  npm run passage:inventory -- --all-unindexed
  npm run passage:inventory -- --all-unindexed --dry-run
  Optional: --force  (regenerate even if cache hit)
`);
  process.exit(1);
}

function parseArgs(argv: string[]): {
  mode: Mode;
  force: boolean;
  dryRun: boolean;
} {
  const tokens = argv.slice(2);
  const force = parseFlag(tokens, "--force");
  const dryRun = parseFlag(tokens, "--dry-run");
  const passage = parseOption(tokens, "--passage");
  const evaluationId = parseOption(tokens, "--evaluation-id");
  const all = parseFlag(tokens, "--all-unindexed");

  const set = [Boolean(passage), Boolean(evaluationId), all].filter(Boolean)
    .length;
  if (set !== 1) usage();

  if (passage) return { mode: { kind: "passage", raw: passage }, force, dryRun };
  if (evaluationId)
    return { mode: { kind: "evaluation", id: evaluationId }, force, dryRun };
  return { mode: { kind: "all-unindexed" }, force, dryRun };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function writeSkippedCsv(rows: SkipRow[]): void {
  mkdirSync(SKIP_CSV_DIR, { recursive: true });
  const lines = [SKIP_CSV_HEADER];
  for (const row of rows) {
    lines.push(
      [
        row.sermon_id,
        row.evaluation_id,
        row.primary_passage_raw,
        row.skip_reason,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  writeFileSync(SKIP_CSV_PATH, `${lines.join("\n")}\n`, "utf8");
}

function printSkipTally(
  parsed: number,
  skips: SkipRow[],
): void {
  const byReason = new Map<string, number>();
  for (const s of skips) {
    byReason.set(s.skip_reason, (byReason.get(s.skip_reason) ?? 0) + 1);
  }
  const brokenOut = [...byReason.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, n]) => `${reason}=${n}`)
    .join("; ");
  console.log(
    `tally: parsed=${parsed} skipped=${skips.length}` +
      (skips.length ? ` (${brokenOut})` : ""),
  );
  if (skips.length) {
    console.log(`skip log: ${SKIP_CSV_PATH}`);
  }
}

async function generateInventory(
  client: Anthropic,
  passageRefDisplay: string,
): Promise<PassageInventoryFields> {
  const response = await client.messages.create({
    model: PASSAGE_INVENTORY_MODEL,
    max_tokens: 8_000,
    system: buildInventorySystemPrompt(),
    messages: [
      { role: "user", content: buildInventoryUserMessage(passageRefDisplay) },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text content.");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonObject(textBlock.text);
  } catch (err) {
    throw new Error(
      `Model output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return passageInventoryFieldsSchema.parse(parsed);
}

async function hasExisting(
  supabase: ReturnType<typeof createServiceClient>,
  normalized: string,
  promptVersion: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("passage_inventories")
    .select("id")
    .eq("passage_ref_normalized", normalized)
    .eq("prompt_version", promptVersion)
    .maybeSingle();

  if (error) {
    if (/schema cache|does not exist|Could not find the table/i.test(error.message)) {
      return null;
    }
    throw new Error(`Lookup failed: ${error.message}`);
  }
  return data ? { id: data.id as string } : null;
}

async function writeInventory(
  supabase: ReturnType<typeof createServiceClient>,
  input: {
    raw: string;
    normalized: string;
    fields: PassageInventoryFields;
    model: string;
    force: boolean;
    existingId: string | null;
  },
): Promise<string> {
  const row = {
    passage_ref_raw: input.raw,
    passage_ref_normalized: input.normalized,
    argument: input.fields.argument,
    hinge: input.fields.hinge,
    load_bearing: input.fields.load_bearing,
    contested_cruxes: input.fields.contested_cruxes,
    original_language_terms: input.fields.original_language_terms,
    redemptive_elements: input.fields.redemptive_elements,
    burden: input.fields.burden,
    model: input.model,
    prompt_version: PASSAGE_INVENTORY_PROMPT_VERSION,
  };

  if (input.force && input.existingId) {
    const { data, error } = await supabase
      .from("passage_inventories")
      .update(row)
      .eq("id", input.existingId)
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Update failed");
    }
    return data.id as string;
  }

  const { data, error } = await supabase
    .from("passage_inventories")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Insert failed");
  }
  return data.id as string;
}

async function processOnePassage(
  supabase: ReturnType<typeof createServiceClient>,
  anthropic: Anthropic | null,
  raw: string,
  force: boolean,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped" | "invalid" | "would_create"> {
  const normalized = normalizePassageRef(raw);
  if (!normalized.ok) {
    // Single-passage mode: skip CSV is authored by --all-unindexed only.
    console.warn(
      `skip unparseable: ${JSON.stringify(raw)} (${normalized.reason})`,
    );
    return "invalid";
  }

  const existing = await hasExisting(
    supabase,
    normalized.normalized,
    PASSAGE_INVENTORY_PROMPT_VERSION,
  );

  if (existing && !force) {
    console.log(
      `skip cache hit: ${normalized.normalized} (${PASSAGE_INVENTORY_PROMPT_VERSION}) id=${existing.id}`,
    );
    return "skipped";
  }

  if (dryRun) {
    console.log(
      `would generate: ${normalized.normalized} (raw=${JSON.stringify(raw)})`,
    );
    return "would_create";
  }

  if (!anthropic) {
    throw new Error("Anthropic client required when not in --dry-run");
  }

  console.log(
    `generate: ${normalized.normalized} (raw=${JSON.stringify(raw)}) model=${PASSAGE_INVENTORY_MODEL}`,
  );

  // Prompt isolation: only the reference string reaches the model.
  const fields = await generateInventory(anthropic, normalized.normalized);
  const id = await writeInventory(supabase, {
    raw,
    normalized: normalized.normalized,
    fields,
    model: PASSAGE_INVENTORY_MODEL,
    force,
    existingId: existing?.id ?? null,
  });

  console.log(
    `${existing && force ? "updated" : "created"}: ${normalized.normalized} id=${id}`,
  );
  console.log(`  hinge: ${fields.hinge.slice(0, 120)}`);
  return existing && force ? "updated" : "created";
}

/**
 * Resolve primary_passage from an evaluation. Strict: sermon.primary_passage
 * only — no meta.scripture_reference fallback.
 */
async function primaryPassageForEvaluation(
  supabase: ReturnType<typeof createServiceClient>,
  evaluationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, sermon_versions!inner(sermons!inner(primary_passage))",
    )
    .eq("id", evaluationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Evaluation lookup failed: ${error.message}`);
  }
  if (!data) {
    console.error(`Evaluation not found: ${evaluationId}`);
    return null;
  }

  const sermon = (
    data as {
      sermon_versions?: { sermons?: { primary_passage?: string | null } };
    }
  ).sermon_versions?.sermons;
  const pp = sermon?.primary_passage;
  if (typeof pp !== "string" || !pp.trim()) {
    console.warn(
      `evaluation ${evaluationId}: primary_passage empty — strict skip (no meta fallback)`,
    );
    return null;
  }
  return pp.trim();
}

type CollectResult = {
  /** normalized → one raw representative */
  need: Map<string, string>;
  /** total complete-eval rows whose primary_passage parsed */
  parsedEvalCount: number;
  skips: SkipRow[];
};

async function collectUnindexedPassages(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<CollectResult> {
  const { data: evals, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, sermon_versions!inner(sermon_id, sermons!inner(id, primary_passage))",
    )
    .eq("status", "complete");

  if (error) {
    throw new Error(`List evaluations failed: ${error.message}`);
  }

  const rawByNormalized = new Map<string, string>();
  const skips: SkipRow[] = [];
  let parsedEvalCount = 0;

  for (const row of evals ?? []) {
    const evaluationId = row.id as string;
    const version = (
      row as {
        sermon_versions?: {
          sermon_id?: string;
          sermons?: { id?: string; primary_passage?: string | null };
        };
      }
    ).sermon_versions;
    const sermonId =
      (version?.sermons?.id as string | undefined) ??
      (version?.sermon_id as string | undefined) ??
      "";
    const pp = version?.sermons?.primary_passage;

    if (typeof pp !== "string" || !pp.trim()) {
      skips.push({
        sermon_id: sermonId,
        evaluation_id: evaluationId,
        primary_passage_raw: "",
        skip_reason: "primary_passage empty",
      });
      continue;
    }

    const raw = pp.trim();
    const n = normalizePassageRef(raw);
    if (!n.ok) {
      skips.push({
        sermon_id: sermonId,
        evaluation_id: evaluationId,
        primary_passage_raw: raw,
        skip_reason: n.reason,
      });
      continue;
    }

    parsedEvalCount += 1;
    if (!rawByNormalized.has(n.normalized)) {
      rawByNormalized.set(n.normalized, raw);
    }
  }

  writeSkippedCsv(skips);

  const { data: existing, error: e2 } = await supabase
    .from("passage_inventories")
    .select("passage_ref_normalized")
    .eq("prompt_version", PASSAGE_INVENTORY_PROMPT_VERSION);

  // Table may not be applied yet (pre-migration). Treat as empty cache so
  // dry-run tallies and skip CSV still work.
  if (e2) {
    const missing =
      /schema cache|does not exist|Could not find the table/i.test(e2.message);
    if (!missing) {
      throw new Error(`List inventories failed: ${e2.message}`);
    }
    console.warn(
      `passage_inventories not present (${e2.message}) — treating as empty`,
    );
  }

  const have = new Set(
    (existing ?? []).map((r) => r.passage_ref_normalized as string),
  );

  const need = new Map<string, string>();
  for (const [norm, raw] of rawByNormalized) {
    if (!have.has(norm)) need.set(norm, raw);
  }

  return { need, parsedEvalCount, skips };
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const { mode, force, dryRun } = parseArgs(process.argv);
  const supabase = createServiceClient();

  let anthropic: Anthropic | null = null;
  if (!dryRun) {
    requireEnv("ANTHROPIC_API_KEY");
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  const counts = {
    created: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    would_create: 0,
  };

  async function tally(raw: string): Promise<void> {
    const result = await processOnePassage(
      supabase,
      anthropic,
      raw,
      force,
      dryRun,
    );
    counts[result] += 1;
  }

  if (mode.kind === "passage") {
    await tally(mode.raw);
  } else if (mode.kind === "evaluation") {
    const pp = await primaryPassageForEvaluation(supabase, mode.id);
    if (!pp) {
      process.exit(1);
    }
    await tally(pp);
  } else {
    const { need, parsedEvalCount, skips } =
      await collectUnindexedPassages(supabase);
    printSkipTally(parsedEvalCount, skips);
    console.log(
      `all-unindexed${dryRun ? " (dry-run)" : ""}: ${need.size} distinct parseable passages missing inventory @${PASSAGE_INVENTORY_PROMPT_VERSION}`,
    );
    for (const [norm, raw] of need) {
      console.log(`— ${norm}`);
      await tally(raw);
    }
  }

  console.log("done", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
