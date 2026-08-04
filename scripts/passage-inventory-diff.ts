/**
 * Compare a stored passage inventory against a stored evaluation (shadow mode).
 *
 * Output:
 *   output/passage-diff/<evaluationId>.md
 *   output/passage-diff/summary.csv  (append)
 *
 * CSV columns (crux trichotomy is crux-only; binary unaddressed for the rest):
 *   evaluation_id, passage, inventory_items, load_bearing_items,
 *   items_unaddressed, load_bearing_unaddressed,
 *   omission_rate_all, omission_rate_load_bearing,
 *   crux_engaged, crux_mentioned_only, crux_absent,
 *   overreach_flagged, overreach_missed
 *
 * Strict primary_passage only — no meta.scripture_reference fallback.
 *
 * Usage:
 *   npm run passage:diff -- --evaluation-id=<uuid>
 *   npm run passage:diff -- --series="Hebrews"
 *   npm run passage:diff -- --all
 *   Optional: --force
 *
 * Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { mkdirSync, appendFileSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  buildDiffSystemPrompt,
  buildDiffUserMessage,
  buildEvaluationCorpus,
  inventoryItemsForDiff,
  summarizeDiffItems,
  type DiffModelResult,
} from "../src/lib/passage/diff-prompt";
import {
  PASSAGE_DIFF_MODEL,
  PASSAGE_INVENTORY_PROMPT_VERSION,
  passageInventoryFieldsSchema,
  type PassageInventoryFields,
  type PassageInventoryRow,
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


const DIFF_OUT_DIR = join(process.cwd(), "output", "passage-diff");
const CSV_PATH = join(DIFF_OUT_DIR, "summary.csv");
const FAILED_CSV_PATH = join(DIFF_OUT_DIR, "failed.csv");
const FAILED_CSV_HEADER = "evaluation_id,error,raw_path";
const RAW_DIR = join(DIFF_OUT_DIR, "raw");
const CSV_HEADER = [
  "evaluation_id",
  "passage",
  "inventory_items",
  "load_bearing_items",
  "items_unaddressed",
  "load_bearing_unaddressed",
  "omission_rate_all",
  "omission_rate_load_bearing",
  "crux_engaged",
  "crux_mentioned_only",
  "crux_absent",
  "overreach_flagged",
  "overreach_missed",
].join(",");

const itemResultSchema = z
  .object({
    item_id: z.string(),
    item_type: z.string(),
    label: z.string(),
    weight: z.enum(["load_bearing", "available"]),
    weight_assigned_by: z.enum(["inventory", "diff_promotion"]),
    addressed: z.boolean().optional(),
    engagement: z.enum(["engaged", "mentioned_only", "absent"]).optional(),
    note: z.string().optional(),
  })
  .superRefine((row, ctx) => {
    if (row.item_type === "contested_crux") {
      if (row.engagement == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contested_crux requires engagement",
          path: ["engagement"],
        });
      }
      if (row.addressed != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contested_crux must not set addressed",
          path: ["addressed"],
        });
      }
    } else {
      if (row.addressed == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "non-crux requires addressed",
          path: ["addressed"],
        });
      }
      if (row.engagement != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "non-crux must not set engagement",
          path: ["engagement"],
        });
      }
    }
  });

const diffResultSchema = z.object({
  summary: z.string(),
  item_results: z.array(itemResultSchema).min(1),
  overreach_correctly_flagged: z.array(
    z.object({
      claim_or_risk: z.string(),
      how_eval_handled: z.string(),
    }),
  ),
  overreach_missed: z.array(
    z.object({
      claim_or_risk: z.string(),
      evaluation_problem: z.string(),
    }),
  ),
});

type Mode =
  | { kind: "evaluation"; id: string }
  | { kind: "series"; series: string }
  | { kind: "all" };

function usage(): never {
  console.error(`Usage:
  npm run passage:diff -- --evaluation-id=<uuid>
  npm run passage:diff -- --series="Hebrews"
  npm run passage:diff -- --all
  Optional: --force  (re-diff even if already in summary.csv)
`);
  process.exit(1);
}

function parseArgs(argv: string[]): { mode: Mode; force: boolean } {
  const tokens = argv.slice(2);
  const force = parseFlag(tokens, "--force");
  const evaluationId = parseOption(tokens, "--evaluation-id");
  const series = parseOption(tokens, "--series");
  const all = parseFlag(tokens, "--all");

  const set = [Boolean(evaluationId), Boolean(series), all].filter(Boolean)
    .length;
  if (set !== 1) usage();

  if (evaluationId) return { mode: { kind: "evaluation", id: evaluationId }, force };
  if (series) return { mode: { kind: "series", series }, force };
  return { mode: { kind: "all" }, force };
}

/** Evaluation ids already present in summary.csv (first column). */
function alreadyDiffedIds(): Set<string> {
  if (!existsSync(CSV_PATH)) return new Set();
  const lines = readFileSync(CSV_PATH, "utf8").split("\n").slice(1);
  const ids = new Set<string>();
  for (const line of lines) {
    if (!line.trim()) continue;
    // First CSV field; ids are UUIDs without commas or quotes.
    const first = line.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? "";
    if (first) ids.add(first);
  }
  return ids;
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rate(num: number, den: number): string {
  if (den === 0) return "0";
  return (num / den).toFixed(4);
}

function ensureOutput(): void {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  mkdirSync(RAW_DIR, { recursive: true });
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, `${CSV_HEADER}\n`, "utf8");
  } else {
    // Schema change: rewrite header if this file is pre-v2 columns.
    const existing = readFileSync(CSV_PATH, "utf8");
    const firstLine = existing.split("\n")[0]?.trim() ?? "";
    if (firstLine !== CSV_HEADER) {
      console.warn(
        `summary.csv header outdated — rotating to ${CSV_PATH}.bak and starting fresh header`,
      );
      writeFileSync(`${CSV_PATH}.bak`, existing, "utf8");
      writeFileSync(CSV_PATH, `${CSV_HEADER}\n`, "utf8");
    }
  }
  if (!existsSync(FAILED_CSV_PATH)) {
    writeFileSync(FAILED_CSV_PATH, `${FAILED_CSV_HEADER}\n`, "utf8");
  }
}

function appendFailedRow(row: {
  evaluation_id: string;
  error: string;
  raw_path: string;
}): void {
  ensureOutput();
  const line = [row.evaluation_id, row.error, row.raw_path]
    .map(csvEscape)
    .join(",");
  appendFileSync(FAILED_CSV_PATH, `${line}\n`, "utf8");
}

/** Persist model text for parse/schema diagnosis. Returns relative path written. */
function writeRawModelResponse(
  evaluationId: string,
  rawText: string,
  meta?: { error?: string; stop_reason?: string | null },
): string {
  mkdirSync(RAW_DIR, { recursive: true });
  const absPath = join(RAW_DIR, `${evaluationId}.json`);
  const payload = {
    evaluation_id: evaluationId,
    saved_at: new Date().toISOString(),
    error: meta?.error ?? null,
    stop_reason: meta?.stop_reason ?? null,
    char_length: rawText.length,
    raw_text: rawText,
  };
  writeFileSync(absPath, JSON.stringify(payload, null, 2), "utf8");
  return absPath;
}

function appendCsvRow(row: Record<string, string | number>): void {
  const line = [
    row.evaluation_id,
    row.passage,
    row.inventory_items,
    row.load_bearing_items,
    row.items_unaddressed,
    row.load_bearing_unaddressed,
    row.omission_rate_all,
    row.omission_rate_load_bearing,
    row.crux_engaged,
    row.crux_mentioned_only,
    row.crux_absent,
    row.overreach_flagged,
    row.overreach_missed,
  ]
    .map(csvEscape)
    .join(",");
  appendFileSync(CSV_PATH, `${line}\n`, "utf8");
}

function rowToFields(row: PassageInventoryRow): PassageInventoryFields {
  return passageInventoryFieldsSchema.parse({
    argument: row.argument,
    hinge: row.hinge,
    load_bearing: row.load_bearing,
    contested_cruxes: row.contested_cruxes,
    original_language_terms: row.original_language_terms,
    redemptive_elements: row.redemptive_elements,
    burden: row.burden,
  });
}

async function loadInventory(
  supabase: ReturnType<typeof createServiceClient>,
  normalized: string,
): Promise<PassageInventoryRow | null> {
  const { data, error } = await supabase
    .from("passage_inventories")
    .select("*")
    .eq("passage_ref_normalized", normalized)
    .eq("prompt_version", PASSAGE_INVENTORY_PROMPT_VERSION)
    .maybeSingle();

  if (error) throw new Error(`Inventory load failed: ${error.message}`);
  return (data as PassageInventoryRow | null) ?? null;
}

type EvalBundle = {
  id: string;
  result: unknown;
  coaching_narrative: unknown;
  how_it_preaches: unknown;
  primary_passage: string;
};

async function loadEvaluation(
  supabase: ReturnType<typeof createServiceClient>,
  evaluationId: string,
): Promise<EvalBundle | null> {
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, result, coaching_narrative, how_it_preaches, sermon_versions!inner(sermons!inner(primary_passage))",
    )
    .eq("id", evaluationId)
    .maybeSingle();

  if (error) throw new Error(`Evaluation load failed: ${error.message}`);
  if (!data) {
    console.error(`Evaluation not found: ${evaluationId}`);
    return null;
  }

  const pp = (
    data as {
      sermon_versions?: { sermons?: { primary_passage?: string | null } };
    }
  ).sermon_versions?.sermons?.primary_passage;

  if (typeof pp !== "string" || !pp.trim()) {
    console.warn(
      `evaluation ${evaluationId}: primary_passage empty — strict skip (no meta fallback)`,
    );
    return null;
  }

  if ((data as { status?: string }).status !== "complete") {
    console.warn(
      `evaluation ${evaluationId}: status=${(data as { status?: string }).status} — skip`,
    );
    return null;
  }

  return {
    id: data.id as string,
    result: (data as { result: unknown }).result,
    coaching_narrative: (data as { coaching_narrative: unknown })
      .coaching_narrative,
    how_it_preaches: (data as { how_it_preaches: unknown }).how_it_preaches,
    primary_passage: pp.trim(),
  };
}

async function listSeriesEvaluations(
  supabase: ReturnType<typeof createServiceClient>,
  series: string,
): Promise<string[]> {
  const needle = series.trim().toLowerCase();
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, sermon_versions!inner(sermons!inner(primary_passage))",
    )
    .eq("status", "complete");

  if (error) throw new Error(`Series list failed: ${error.message}`);

  const ids: string[] = [];
  for (const row of data ?? []) {
    const pp = (
      row as {
        sermon_versions?: { sermons?: { primary_passage?: string | null } };
      }
    ).sermon_versions?.sermons?.primary_passage;
    if (typeof pp !== "string" || !pp.trim()) continue;
    const n = normalizePassageRef(pp);
    if (!n.ok) continue;
    if (n.normalized.toLowerCase().startsWith(needle)) {
      ids.push(row.id as string);
    }
  }
  return ids;
}

/**
 * Every complete evaluation with a parseable primary_passage and a matching
 * passage_inventories row at the current inventory prompt_version.
 */
async function listAllDiffableEvaluations(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<string[]> {
  const { data: inventories, error: invError } = await supabase
    .from("passage_inventories")
    .select("passage_ref_normalized")
    .eq("prompt_version", PASSAGE_INVENTORY_PROMPT_VERSION);

  if (invError) {
    throw new Error(`List inventories failed: ${invError.message}`);
  }

  const inventoried = new Set(
    (inventories ?? []).map((r) => r.passage_ref_normalized as string),
  );

  const { data: evals, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, sermon_versions!inner(sermons!inner(primary_passage))",
    )
    .eq("status", "complete");

  if (error) throw new Error(`List evaluations failed: ${error.message}`);

  const ids: string[] = [];
  for (const row of evals ?? []) {
    const pp = (
      row as {
        sermon_versions?: { sermons?: { primary_passage?: string | null } };
      }
    ).sermon_versions?.sermons?.primary_passage;
    if (typeof pp !== "string" || !pp.trim()) continue;
    const n = normalizePassageRef(pp);
    if (!n.ok) continue;
    if (!inventoried.has(n.normalized)) continue;
    ids.push(row.id as string);
  }
  return ids;
}

function validateItemCoverage(
  expectedIds: string[],
  diff: DiffModelResult,
): void {
  const got = new Set(diff.item_results.map((r) => r.item_id));
  const missing = expectedIds.filter((id) => !got.has(id));
  const extra = [...got].filter((id) => !expectedIds.includes(id));
  if (missing.length || extra.length) {
    throw new Error(
      `item_results coverage mismatch; missing=${missing.join(",") || "—"} extra=${extra.join(",") || "—"}`,
    );
  }
}

async function runDiff(
  anthropic: Anthropic,
  fields: PassageInventoryFields,
  passageRef: string,
  corpus: string,
  evaluationId: string,
): Promise<DiffModelResult> {
  const items = inventoryItemsForDiff(fields);
  const response = await anthropic.messages.create({
    model: PASSAGE_DIFF_MODEL,
    max_tokens: 8_000,
    system: buildDiffSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildDiffUserMessage({
          passageRef,
          items,
          evaluationCorpus: corpus,
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Diff model returned no text content.");
  }

  const rawText = textBlock.text;
  try {
    const parsed = diffResultSchema.parse(
      parseJsonObject(rawText),
    ) as DiffModelResult;
    validateItemCoverage(
      items.map((i) => i.id),
      parsed,
    );
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const rawPath = writeRawModelResponse(evaluationId, rawText, {
      error: message,
      stop_reason: response.stop_reason ?? null,
    });
    console.error(
      `parse/schema failure for ${evaluationId} — raw saved to ${rawPath} (stop_reason=${response.stop_reason ?? "?"}, chars=${rawText.length})`,
    );
    throw err;
  }
}

function renderMarkdown(input: {
  evaluationId: string;
  passageRaw: string;
  passageNormalized: string;
  inventoryId: string;
  metrics: ReturnType<typeof summarizeDiffItems>;
  diff: DiffModelResult;
}): string {
  const m = input.metrics;
  const lines: string[] = [];
  lines.push(`# Passage inventory diff`);
  lines.push("");
  lines.push(`- evaluation_id: \`${input.evaluationId}\``);
  lines.push(`- passage (raw): ${input.passageRaw}`);
  lines.push(`- passage (normalized): ${input.passageNormalized}`);
  lines.push(`- inventory_id: \`${input.inventoryId}\``);
  lines.push(`- inventory_items: ${m.inventory_items}`);
  lines.push(`- load_bearing_items: ${m.load_bearing_items}`);
  lines.push(`- items_unaddressed: ${m.items_unaddressed}`);
  lines.push(`- load_bearing_unaddressed: ${m.load_bearing_unaddressed}`);
  lines.push(
    `- omission_rate_all: ${rate(m.items_unaddressed, m.inventory_items)}`,
  );
  lines.push(
    `- omission_rate_load_bearing: ${rate(m.load_bearing_unaddressed, m.load_bearing_items)}`,
  );
  lines.push(
    `- crux engagement: engaged=${m.crux_engaged} mentioned_only=${m.crux_mentioned_only} absent=${m.crux_absent}`,
  );
  lines.push(
    `- overreach_flagged (correctly): ${input.diff.overreach_correctly_flagged.length}`,
  );
  lines.push(`- overreach_missed: ${input.diff.overreach_missed.length}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(input.diff.summary);
  lines.push("");
  lines.push(`## Contested crux engagement`);
  lines.push("");
  const cruxes = input.diff.item_results.filter(
    (r) => r.item_type === "contested_crux",
  );
  if (cruxes.length === 0) {
    lines.push("_None._");
  } else {
    for (const c of cruxes) {
      lines.push(
        `- **[${c.engagement}]** ${c.label}${c.note ? ` — ${c.note}` : ""} (weight=${c.weight}, by=${c.weight_assigned_by})`,
      );
    }
  }
  lines.push("");
  lines.push(`## Non-crux unaddressed`);
  lines.push("");
  const nonCruxMiss = input.diff.item_results.filter(
    (r) => r.item_type !== "contested_crux" && r.addressed === false,
  );
  if (nonCruxMiss.length === 0) {
    lines.push("_None._");
  } else {
    for (const o of nonCruxMiss) {
      lines.push(
        `- **${o.label}** (${o.item_type}, weight=${o.weight}, by=${o.weight_assigned_by})${o.note ? ` — ${o.note}` : ""}`,
      );
    }
  }
  lines.push("");
  lines.push(`## Overreach correctly flagged`);
  lines.push("");
  if (input.diff.overreach_correctly_flagged.length === 0) {
    lines.push("_None._");
  } else {
    for (const o of input.diff.overreach_correctly_flagged) {
      lines.push(`- **${o.claim_or_risk}** — ${o.how_eval_handled}`);
    }
  }
  lines.push("");
  lines.push(`## Overreach missed`);
  lines.push("");
  if (input.diff.overreach_missed.length === 0) {
    lines.push("_None._");
  } else {
    for (const o of input.diff.overreach_missed) {
      lines.push(`- **${o.claim_or_risk}** — ${o.evaluation_problem}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

async function diffOne(
  supabase: ReturnType<typeof createServiceClient>,
  anthropic: Anthropic,
  evaluationId: string,
): Promise<"ok" | "skip"> {
  const evalRow = await loadEvaluation(supabase, evaluationId);
  if (!evalRow) return "skip";

  const normalized = normalizePassageRef(evalRow.primary_passage);
  if (!normalized.ok) {
    console.warn(
      `evaluation ${evaluationId}: unparseable primary_passage ${JSON.stringify(evalRow.primary_passage)} (${normalized.reason})`,
    );
    return "skip";
  }

  const inv = await loadInventory(supabase, normalized.normalized);
  if (!inv) {
    console.warn(
      `evaluation ${evaluationId}: no inventory for ${normalized.normalized} @${PASSAGE_INVENTORY_PROMPT_VERSION} — run passage:inventory first`,
    );
    return "skip";
  }

  const fields = rowToFields(inv);
  const corpus = buildEvaluationCorpus({
    result: evalRow.result,
    coaching_narrative: evalRow.coaching_narrative,
    how_it_preaches: evalRow.how_it_preaches,
  });

  console.log(
    `diff: eval=${evaluationId} passage=${normalized.normalized}`,
  );

  const diff = await runDiff(
    anthropic,
    fields,
    normalized.normalized,
    corpus,
    evaluationId,
  );
  const metrics = summarizeDiffItems(diff.item_results);

  const md = renderMarkdown({
    evaluationId,
    passageRaw: evalRow.primary_passage,
    passageNormalized: normalized.normalized,
    inventoryId: inv.id,
    metrics,
    diff,
  });

  ensureOutput();
  const mdPath = join(DIFF_OUT_DIR, `${evaluationId}.md`);
  writeFileSync(mdPath, md, "utf8");

  appendCsvRow({
    evaluation_id: evaluationId,
    passage: normalized.normalized,
    inventory_items: metrics.inventory_items,
    load_bearing_items: metrics.load_bearing_items,
    items_unaddressed: metrics.items_unaddressed,
    load_bearing_unaddressed: metrics.load_bearing_unaddressed,
    omission_rate_all: rate(
      metrics.items_unaddressed,
      metrics.inventory_items,
    ),
    omission_rate_load_bearing: rate(
      metrics.load_bearing_unaddressed,
      metrics.load_bearing_items,
    ),
    crux_engaged: metrics.crux_engaged,
    crux_mentioned_only: metrics.crux_mentioned_only,
    crux_absent: metrics.crux_absent,
    overreach_flagged: diff.overreach_correctly_flagged.length,
    overreach_missed: diff.overreach_missed.length,
  });

  console.log(`wrote ${mdPath}`);
  console.log(
    `  unaddressed=${metrics.items_unaddressed}/${metrics.inventory_items} ` +
      `lb_unaddressed=${metrics.load_bearing_unaddressed}/${metrics.load_bearing_items} ` +
      `crux e/m/a=${metrics.crux_engaged}/${metrics.crux_mentioned_only}/${metrics.crux_absent} ` +
      `overreach_missed=${diff.overreach_missed.length}`,
  );
  return "ok";
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const { mode, force } = parseArgs(process.argv);
  requireEnv("ANTHROPIC_API_KEY");
  const supabase = createServiceClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  ensureOutput();

  let ids: string[];
  if (mode.kind === "evaluation") {
    ids = [mode.id];
  } else if (mode.kind === "series") {
    ids = await listSeriesEvaluations(supabase, mode.series);
    console.log(
      `series ${JSON.stringify(mode.series)}: ${ids.length} complete evals with parseable primary_passage`,
    );
  } else {
    ids = await listAllDiffableEvaluations(supabase);
    console.log(
      `all: ${ids.length} complete evals with parseable primary_passage and inventory @${PASSAGE_INVENTORY_PROMPT_VERSION}`,
    );
  }

  const done = alreadyDiffedIds();
  const totals = { ok: 0, skip: 0, already: 0, failed: 0 };
  const total = ids.length;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const n = i + 1;
    if (!force && done.has(id)) {
      totals.already += 1;
      console.log(`[${n}/${total}] skip already diffed: ${id}`);
      continue;
    }
    console.log(`[${n}/${total}]`);
    try {
      const result = await diffOne(supabase, anthropic, id);
      if (result === "ok") {
        totals.ok += 1;
        done.add(id);
      } else {
        totals.skip += 1;
      }
    } catch (err) {
      totals.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${n}/${total}] FAILED ${id}: ${message}`);
      const rawPath = join(RAW_DIR, `${id}.json`);
      appendFailedRow({
        evaluation_id: id,
        error: message,
        raw_path: existsSync(rawPath) ? rawPath : "",
      });
    }
  }

  console.log(
    `tally: ok=${totals.ok} skip=${totals.skip} already=${totals.already} failed=${totals.failed} total=${total}`,
  );
  console.log(`done csv=${CSV_PATH}`);
  if (totals.failed > 0) {
    console.log(`failed log: ${FAILED_CSV_PATH}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
