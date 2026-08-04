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
 *   npm run passage:inventory -- --passage="Hebrews 3:1-6" --force
 *
 * Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

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

type Mode =
  | { kind: "passage"; raw: string }
  | { kind: "evaluation"; id: string }
  | { kind: "all-unindexed" };

function usage(): never {
  console.error(`Usage:
  npm run passage:inventory -- --passage="Hebrews 3:1-6"
  npm run passage:inventory -- --evaluation-id=<uuid>
  npm run passage:inventory -- --all-unindexed
  Optional: --force  (regenerate even if cache hit)
`);
  process.exit(1);
}

function parseArgs(argv: string[]): { mode: Mode; force: boolean } {
  const tokens = argv.slice(2);
  const force = parseFlag(tokens, "--force");
  const passage = parseOption(tokens, "--passage");
  const evaluationId = parseOption(tokens, "--evaluation-id");
  const all = parseFlag(tokens, "--all-unindexed");

  const set = [Boolean(passage), Boolean(evaluationId), all].filter(Boolean)
    .length;
  if (set !== 1) usage();

  if (passage) return { mode: { kind: "passage", raw: passage }, force };
  if (evaluationId)
    return { mode: { kind: "evaluation", id: evaluationId }, force };
  return { mode: { kind: "all-unindexed" }, force };
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
  anthropic: Anthropic,
  raw: string,
  force: boolean,
): Promise<"created" | "updated" | "skipped" | "invalid"> {
  const normalized = normalizePassageRef(raw);
  if (!normalized.ok) {
    console.warn(`skip unparseable: ${JSON.stringify(raw)} (${normalized.reason})`);
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

async function collectUnindexedPassages(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<Map<string, string>> {
  // Map normalized → one raw representative for display/store.
  const { data: evals, error } = await supabase
    .from("sermon_evaluations")
    .select("id, status, sermon_versions!inner(sermons!inner(primary_passage))")
    .eq("status", "complete");

  if (error) {
    throw new Error(`List evaluations failed: ${error.message}`);
  }

  const rawByNormalized = new Map<string, string>();
  for (const row of evals ?? []) {
    const pp = (
      row as {
        sermon_versions?: { sermons?: { primary_passage?: string | null } };
      }
    ).sermon_versions?.sermons?.primary_passage;
    if (typeof pp !== "string" || !pp.trim()) continue;
    const n = normalizePassageRef(pp);
    if (!n.ok) {
      console.warn(`skip unparseable primary_passage: ${JSON.stringify(pp)} (${n.reason})`);
      continue;
    }
    if (!rawByNormalized.has(n.normalized)) {
      rawByNormalized.set(n.normalized, pp.trim());
    }
  }

  const { data: existing, error: e2 } = await supabase
    .from("passage_inventories")
    .select("passage_ref_normalized")
    .eq("prompt_version", PASSAGE_INVENTORY_PROMPT_VERSION);

  if (e2) {
    throw new Error(`List inventories failed: ${e2.message}`);
  }

  const have = new Set(
    (existing ?? []).map((r) => r.passage_ref_normalized as string),
  );

  const need = new Map<string, string>();
  for (const [norm, raw] of rawByNormalized) {
    if (!have.has(norm)) need.set(norm, raw);
  }
  return need;
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const { mode, force } = parseArgs(process.argv);
  requireEnv("ANTHROPIC_API_KEY");
  const supabase = createServiceClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const counts = { created: 0, updated: 0, skipped: 0, invalid: 0 };

  async function tally(raw: string): Promise<void> {
    const result = await processOnePassage(supabase, anthropic, raw, force);
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
    const need = await collectUnindexedPassages(supabase);
    console.log(
      `all-unindexed: ${need.size} distinct parseable passages missing inventory @${PASSAGE_INVENTORY_PROMPT_VERSION}`,
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
