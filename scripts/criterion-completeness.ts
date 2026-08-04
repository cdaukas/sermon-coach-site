/**
 * Criterion-completeness axis (shadow mode).
 *
 * Passage-independent: reads static checklists in
 * docs/criterion-completeness-checklists.json and scores whether a stored
 * evaluation's criterion narratives (and scores) handle the required elements
 * of a full treatment. Separate from the passage-inventory diff — do not merge
 * rates.
 *
 * Output:
 *   output/criterion-completeness/<evaluationId>.md
 *   output/criterion-completeness/summary.csv  (append)
 *
 * Usage:
 *   npm run criterion:completeness -- --evaluation-id=<uuid>
 *   npm run criterion:completeness -- --all-complete   # every complete eval with result
 *
 * Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Checklists with status "placeholder" and empty checklist arrays are skipped
 * until Chris fills them.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  createServiceClient,
  loadEnvLocalIfPresent,
  parseFlag,
  parseJsonObject,
  parseOption,
  requireEnv,
} from "./lib/script-env";

const MODEL = "claude-sonnet-4-6";
const CHECKLIST_PATH = join(
  process.cwd(),
  "docs",
  "criterion-completeness-checklists.json",
);
const OUT_DIR = join(process.cwd(), "output", "criterion-completeness");
const CSV_PATH = join(OUT_DIR, "summary.csv");
const CSV_HEADER =
  "evaluation_id,criterion_id,checklist_items,items_met,items_missed,missed_ids";

const checklistItemSchema = z.object({
  id: z.string(),
  requirement: z.string(),
  absence_is_diagnostic: z.boolean().optional(),
  example_failure: z.string().optional(),
});

const criterionDefSchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  status: z.enum(["worked_example", "placeholder", "ready"]),
  rubric: z.string(),
  checklist: z.array(checklistItemSchema),
});

const fileSchema = z.object({
  version: z.string(),
  criteria: z.array(criterionDefSchema),
});

const modelJudgmentSchema = z.object({
  criterion_id: z.string(),
  summary: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      met: z.boolean(),
      evidence: z.string(),
    }),
  ),
});

function usage(): never {
  console.error(`Usage:
  npm run criterion:completeness -- --evaluation-id=<uuid>
  npm run criterion:completeness -- --all-complete
`);
  process.exit(1);
}

function parseArgs(argv: string[]):
  | { kind: "evaluation"; id: string }
  | { kind: "all-complete" } {
  const tokens = argv.slice(2);
  const evaluationId = parseOption(tokens, "--evaluation-id");
  const all = parseFlag(tokens, "--all-complete");
  if (evaluationId && !all) return { kind: "evaluation", id: evaluationId };
  if (all && !evaluationId) return { kind: "all-complete" };
  usage();
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function loadChecklists() {
  const raw = JSON.parse(readFileSync(CHECKLIST_PATH, "utf8"));
  const file = fileSchema.parse(raw);
  const active = file.criteria.filter(
    (c) => c.checklist.length > 0 && c.status !== "placeholder",
  );
  if (active.length === 0) {
    console.warn(
      "No active criterion checklists (all placeholders). Fill docs/criterion-completeness-checklists.json — nothing to score.",
    );
  }
  return { file, active };
}

function ensureOutput(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, `${CSV_HEADER}\n`, "utf8");
  }
}

function extractCriterionCorpus(
  result: unknown,
  canonicalName: string,
): { score: number | null; narrative: string; rest: string } {
  const r = result as {
    categories?: Array<{
      criteria?: Array<{
        name?: string;
        score?: number;
        narrative?: string;
      }>;
    }>;
    verdict?: { affirmation?: string; improvement?: string };
    top_priorities?: Array<{ headline?: string; rationale?: string }>;
  } | null;

  let score: number | null = null;
  let narrative = "";
  if (r?.categories) {
    for (const cat of r.categories) {
      for (const c of cat.criteria ?? []) {
        if ((c.name ?? "").toLowerCase() === canonicalName.toLowerCase()) {
          score = typeof c.score === "number" ? c.score : null;
          narrative = c.narrative ?? "";
        }
      }
    }
  }

  const restParts: string[] = [];
  if (r?.verdict) {
    restParts.push(
      `verdict: ${r.verdict.affirmation ?? ""} | ${r.verdict.improvement ?? ""}`,
    );
  }
  if (Array.isArray(r?.top_priorities)) {
    for (const p of r.top_priorities) {
      restParts.push(`priority: ${p.headline ?? ""} — ${p.rationale ?? ""}`);
    }
  }

  return { score, narrative, rest: restParts.join("\n") };
}

async function judgeCriterion(
  anthropic: Anthropic,
  criterion: z.infer<typeof criterionDefSchema>,
  corpus: { score: number | null; narrative: string; rest: string },
): Promise<z.infer<typeof modelJudgmentSchema>> {
  const system = `You measure whether a stored sermon evaluation's treatment of ONE criterion covers a fixed checklist of what a full treatment of that criterion requires. This is passage-independent completeness of the evaluation's diagnostic work — not whether the sermon was good.

For each checklist item, decide met=true only when the evaluation's criterion narrative (or immediately related verdict/priorities text) shows the evaluation attended to that requirement — either by affirming it was present in the sermon or by naming it as missing. A high criterion score with silence on the requirement is met=false when absence_is_diagnostic.

Return strict JSON only.`;

  const user = `Criterion: ${criterion.canonical_name} (id=${criterion.id})
Rubric note: ${criterion.rubric}

Evaluation criterion score: ${corpus.score ?? "unknown"}
Evaluation criterion narrative:
${corpus.narrative || "(empty)"}

Related evaluation material:
${corpus.rest || "(none)"}

Checklist:
${JSON.stringify(criterion.checklist, null, 2)}

Return:
{
  "criterion_id": "${criterion.id}",
  "summary": string,
  "items": [ { "id": string, "met": boolean, "evidence": string } ]
}
Every checklist id must appear once.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4_000,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text from criterion completeness model");
  }
  return modelJudgmentSchema.parse(parseJsonObject(text.text));
}

async function runOne(
  supabase: ReturnType<typeof createServiceClient>,
  anthropic: Anthropic,
  evaluationId: string,
  active: z.infer<typeof criterionDefSchema>[],
): Promise<"ok" | "skip"> {
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select("id, status, result")
    .eq("id", evaluationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.status !== "complete" || !data.result) {
    console.warn(`skip ${evaluationId}: missing complete result`);
    return "skip";
  }

  ensureOutput();
  const mdParts: string[] = [
    `# Criterion completeness`,
    "",
    `- evaluation_id: \`${evaluationId}\``,
    "",
  ];

  for (const criterion of active) {
    const corpus = extractCriterionCorpus(
      data.result,
      criterion.canonical_name,
    );
    if (!corpus.narrative) {
      console.warn(
        `${evaluationId}: no narrative found for ${criterion.canonical_name} — scoring against empty`,
      );
    }
    console.log(
      `criterion-completeness: eval=${evaluationId} criterion=${criterion.id}`,
    );
    const judgment = await judgeCriterion(anthropic, criterion, corpus);
    const missed = judgment.items.filter((i) => !i.met);
    const met = judgment.items.filter((i) => i.met);

    appendFileSync(
      CSV_PATH,
      [
        evaluationId,
        criterion.id,
        judgment.items.length,
        met.length,
        missed.length,
        missed.map((m) => m.id).join("|"),
      ]
        .map(csvEscape)
        .join(",") + "\n",
      "utf8",
    );

    mdParts.push(`## ${criterion.canonical_name}`);
    mdParts.push("");
    mdParts.push(judgment.summary);
    mdParts.push("");
    mdParts.push(`Criterion score in eval: ${corpus.score ?? "?"}`);
    mdParts.push("");
    for (const item of judgment.items) {
      mdParts.push(
        `- **[${item.met ? "met" : "MISS"}]** \`${item.id}\` — ${item.evidence}`,
      );
    }
    mdParts.push("");
  }

  const mdPath = join(OUT_DIR, `${evaluationId}.md`);
  writeFileSync(mdPath, mdParts.join("\n"), "utf8");
  console.log(`wrote ${mdPath}`);
  return "ok";
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const mode = parseArgs(process.argv);
  const { active } = loadChecklists();
  if (active.length === 0) {
    process.exit(0);
  }

  requireEnv("ANTHROPIC_API_KEY");
  const supabase = createServiceClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  ensureOutput();

  let ids: string[];
  if (mode.kind === "evaluation") {
    ids = [mode.id];
  } else {
    const { data, error } = await supabase
      .from("sermon_evaluations")
      .select("id")
      .eq("status", "complete");
    if (error) throw new Error(error.message);
    ids = (data ?? []).map((r) => r.id as string);
    console.log(`all-complete: ${ids.length} evaluations`);
  }

  let ok = 0;
  let skip = 0;
  for (const id of ids) {
    const r = await runOne(supabase, anthropic, id, active);
    if (r === "ok") ok += 1;
    else skip += 1;
  }
  console.log(`done ok=${ok} skip=${skip} csv=${CSV_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
