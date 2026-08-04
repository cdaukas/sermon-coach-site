/**
 * Compare a stored passage inventory against a stored evaluation (shadow mode).
 *
 * Output:
 *   output/passage-diff/<evaluationId>.md
 *   output/passage-diff/summary.csv  (append)
 *
 * Strict primary_passage only — evaluations without preacher-supplied passage skip.
 *
 * Usage:
 *   npm run passage:diff -- --evaluation-id=<uuid>
 *   npm run passage:diff -- --series="Hebrews"
 *
 * Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { mkdirSync, appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  buildDiffSystemPrompt,
  buildDiffUserMessage,
  buildEvaluationCorpus,
} from "../src/lib/passage/diff-prompt";
import {
  countInventoryItems,
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
  parseJsonObject,
  parseOption,
  requireEnv,
} from "./lib/script-env";

const DIFF_OUT_DIR = join(process.cwd(), "output", "passage-diff");
const CSV_PATH = join(DIFF_OUT_DIR, "summary.csv");
const CSV_HEADER =
  "evaluation_id,passage,inventory_items,items_unaddressed,overreach_flagged,overreach_missed";

const diffResultSchema = z.object({
  summary: z.string(),
  omissions: z.array(
    z.object({
      item: z.string(),
      where_should_appear: z.string(),
    }),
  ),
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

type DiffResult = z.infer<typeof diffResultSchema>;

type Mode =
  | { kind: "evaluation"; id: string }
  | { kind: "series"; series: string };

function usage(): never {
  console.error(`Usage:
  npm run passage:diff -- --evaluation-id=<uuid>
  npm run passage:diff -- --series="Hebrews"
`);
  process.exit(1);
}

function parseArgs(argv: string[]): Mode {
  const tokens = argv.slice(2);
  const evaluationId = parseOption(tokens, "--evaluation-id");
  const series = parseOption(tokens, "--series");
  if (evaluationId && !series) return { kind: "evaluation", id: evaluationId };
  if (series && !evaluationId) return { kind: "series", series };
  usage();
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ensureOutput(): void {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, `${CSV_HEADER}\n`, "utf8");
  }
}

function appendCsvRow(row: {
  evaluation_id: string;
  passage: string;
  inventory_items: number;
  items_unaddressed: number;
  overreach_flagged: number;
  overreach_missed: number;
}): void {
  const line = [
    row.evaluation_id,
    row.passage,
    row.inventory_items,
    row.items_unaddressed,
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
  primary_passage: string;
};

async function loadEvaluation(
  supabase: ReturnType<typeof createServiceClient>,
  evaluationId: string,
): Promise<EvalBundle | null> {
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select(
      "id, status, result, coaching_narrative, sermon_versions!inner(sermons!inner(primary_passage))",
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
    // Match series by book name of normalized key (e.g. "Hebrews").
    if (n.normalized.toLowerCase().startsWith(needle)) {
      ids.push(row.id as string);
    }
  }
  return ids;
}

async function runDiff(
  anthropic: Anthropic,
  inventory: PassageInventoryFields,
  passageRef: string,
  corpus: string,
): Promise<DiffResult> {
  const response = await anthropic.messages.create({
    model: PASSAGE_DIFF_MODEL,
    max_tokens: 4_000,
    system: buildDiffSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildDiffUserMessage({
          passageRef,
          inventory,
          evaluationCorpus: corpus,
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Diff model returned no text content.");
  }

  return diffResultSchema.parse(parseJsonObject(textBlock.text));
}

function renderMarkdown(input: {
  evaluationId: string;
  passageRaw: string;
  passageNormalized: string;
  inventoryId: string;
  inventoryItems: number;
  diff: DiffResult;
}): string {
  const lines: string[] = [];
  lines.push(`# Passage inventory diff`);
  lines.push("");
  lines.push(`- evaluation_id: \`${input.evaluationId}\``);
  lines.push(`- passage (raw): ${input.passageRaw}`);
  lines.push(`- passage (normalized): ${input.passageNormalized}`);
  lines.push(`- inventory_id: \`${input.inventoryId}\``);
  lines.push(`- inventory_items: ${input.inventoryItems}`);
  lines.push(
    `- items_unaddressed: ${input.diff.omissions.length}`,
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
  lines.push(`## Omissions`);
  lines.push("");
  if (input.diff.omissions.length === 0) {
    lines.push("_None._");
  } else {
    for (const o of input.diff.omissions) {
      lines.push(`- **${o.item}** — ${o.where_should_appear}`);
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
  const inventoryItems = countInventoryItems(fields);
  const corpus = buildEvaluationCorpus({
    result: evalRow.result,
    coaching_narrative: evalRow.coaching_narrative,
  });

  console.log(
    `diff: eval=${evaluationId} passage=${normalized.normalized}`,
  );

  const diff = await runDiff(
    anthropic,
    fields,
    normalized.normalized,
    corpus,
  );

  const md = renderMarkdown({
    evaluationId,
    passageRaw: evalRow.primary_passage,
    passageNormalized: normalized.normalized,
    inventoryId: inv.id,
    inventoryItems,
    diff,
  });

  ensureOutput();
  const mdPath = join(DIFF_OUT_DIR, `${evaluationId}.md`);
  writeFileSync(mdPath, md, "utf8");

  appendCsvRow({
    evaluation_id: evaluationId,
    passage: normalized.normalized,
    inventory_items: inventoryItems,
    items_unaddressed: diff.omissions.length,
    overreach_flagged: diff.overreach_correctly_flagged.length,
    overreach_missed: diff.overreach_missed.length,
  });

  console.log(`wrote ${mdPath}`);
  console.log(
    `  omissions=${diff.omissions.length} overreach_flagged=${diff.overreach_correctly_flagged.length} overreach_missed=${diff.overreach_missed.length}`,
  );
  return "ok";
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const mode = parseArgs(process.argv);
  requireEnv("ANTHROPIC_API_KEY");
  const supabase = createServiceClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  ensureOutput();

  let ids: string[];
  if (mode.kind === "evaluation") {
    ids = [mode.id];
  } else {
    ids = await listSeriesEvaluations(supabase, mode.series);
    console.log(
      `series ${JSON.stringify(mode.series)}: ${ids.length} complete evals with parseable primary_passage`,
    );
  }

  let ok = 0;
  let skip = 0;
  for (const id of ids) {
    const result = await diffOne(supabase, anthropic, id);
    if (result === "ok") ok += 1;
    else skip += 1;
  }

  console.log(`done ok=${ok} skip=${skip} csv=${CSV_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
