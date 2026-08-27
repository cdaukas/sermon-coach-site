/**
 * Shadow run: do per-criterion band rungs on criteria 1 and 2 move their
 * scores? Nothing here ships.
 *
 * Follow-on to scripts/shadow-gate-removal.ts, which returned a clean null on
 * these two criteria. Same six sermons, pinned by sermon_version_id and
 * verified by manuscript_sha256 so the two experiments are comparable.
 *
 * Two arms, three runs each, 36 runs total. Replication is the point: the
 * previous design could not separate a 1-point effect from Opus variance.
 *
 *   Arm A  buildSystemPrompt() byte-for-byte. Production, gate included.
 *   Arm B  identical, plus band rungs appended to the criterion 1 and
 *          criterion 2 blocks. Nothing else.
 *
 * The strength gate stays in BOTH arms. Rungs are the only variable. The
 * general ladder, the criterion 1 presumption, and the overreach bar are
 * deliberately NOT installed, and assertions below prove they are absent.
 *
 * prompt.ts, rubric.md, and SKILL.md are not modified. The insertion happens
 * in this script and is delivered through runEvaluation's createMessage hook.
 *
 * Usage:
 *   npx tsx scripts/shadow-ladder-rungs.ts --verify-prompts   (no API, no DB)
 *   npx tsx scripts/shadow-ladder-rungs.ts --select-only       (DB read only)
 *   npx tsx scripts/shadow-ladder-rungs.ts --estimate-only
 *   npx tsx scripts/shadow-ladder-rungs.ts
 *   npx tsx scripts/shadow-ladder-rungs.ts --force
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
  type EvaluationResultStrict,
} from "../src/lib/evaluation/schema";
import { formatDisplayScoreBare } from "../src/lib/evaluation/display-score";
import { submitSermonEvaluationTool } from "../src/lib/evaluation/tool-schema";

const MODEL = "claude-opus-4-8";
const RUNS_PER_ARM = 3;
const ARMS = ["A", "B"] as const;
const ESTIMATED_OUTPUT_TOKENS = 10_000;
const CHARS_PER_TOKEN = 4;
/** 36 Opus runs measured near $0.28 each with prefix caching working. */
const COST_ABORT_USD = 16;
/** The two criteria under test. */
const TEST_CRITERIA = [1, 2] as const;

type Arm = (typeof ARMS)[number];

// ---------------------------------------------------------------------------
// Pinned corpus — identical to the gate-removal run
// ---------------------------------------------------------------------------

type PinnedSermon = {
  index: number;
  label: string;
  sermonVersionId: string;
  manuscriptSha256: string;
};

const PINNED_SERMONS: PinnedSermon[] = [
  {
    index: 1,
    label: "Genesis 1",
    sermonVersionId: "e10dd94f-42b1-4a02-9c61-0b033e20ccfa",
    manuscriptSha256:
      "2915f6b8677719664b1f3957757f6d81cbbbed4aac4dd977e29cc5e3d876a98e",
  },
  {
    index: 2,
    label: "John 3:11-21",
    sermonVersionId: "633d0a55-9eaa-420d-b299-06a5598eee26",
    manuscriptSha256:
      "5598882a92b67f37e03b465f5f473c0cb971f8424048adf25d3ce5a981d13acc",
  },
  {
    index: 3,
    label: "The Power of the Word",
    sermonVersionId: "c411fbad-b193-46b7-8b3f-81176841c773",
    manuscriptSha256:
      "4bae4f49fe2d2b448aa88af0cd78ab17826cac7b5f71f0705d26a54cb80360a1",
  },
  {
    index: 4,
    label: "Every Believer's Duty",
    sermonVersionId: "c9853914-1055-4f1e-9365-98f300349bc5",
    manuscriptSha256:
      "99addb79c0e1efd7980f7adfb4c80b707b64a46404ccb876772794fba1f05e41",
  },
  {
    index: 5,
    label: "The House",
    sermonVersionId: "741e2037-8a24-434b-9a70-5f8b9cff442e",
    manuscriptSha256:
      "286a37de43298670b96e998864ad105dcae6b85bc3dbee0ef06f69ff1f895315",
  },
  {
    index: 6,
    label: "The Fire and the Fellowship",
    sermonVersionId: "45c6121e-6a6d-4aef-ac03-ce0609118dc4",
    manuscriptSha256:
      "237181f6d091048d3c69b6c845b4b6b10eba93b6725c82a3215086e0f01ac847",
  },
];

// ---------------------------------------------------------------------------
// Arm B prompt surgery
// ---------------------------------------------------------------------------

/** Criterion 2's header. Criterion 1's rungs go immediately before it. */
const CRITERION_2_HEADER =
  "**2. Christ-centered / redemptive arc** *(Chapell, Christ-Centered Preaching)*";
/** Criterion 3's header. Criterion 2's rungs go immediately before it. */
const CRITERION_3_HEADER =
  "**3. Gospel clarity** *(Piper, The Supremacy of God in Preaching)*";

const CRITERION_1_RUNGS = `Score bands for this criterion:
- 5 — The sermon's argument is the passage's argument, in the passage's order of emphasis. Every clause the application depends on is explained. Claims about the text are demonstrated in front of the congregation or attributed to something checkable, and none outruns what the text supports.
- 4 — The text drives the sermon and the main argument is the passage's, but a secondary clause goes unexplained, or the weight sits where the passage's does not, or a correct claim is asserted rather than shown.
- 3 — The passage is genuinely present and not contradicted, but the text illustrates the sermon rather than generating it. The main points could have come from a different passage. Or the sermon works accurately through what the text says and never reaches what it is doing.
- 2 — Springboard. Words lifted and repurposed. The argument is available without the text.
- 1 — Misreads the passage, or uses it as a pretext for a topic.`;

const CRITERION_2_RUNGS = `Score bands for this criterion:
- 5 — The move to Christ runs through this passage's own redemptive logic and lands as the resolution of the burden the text raised.
- 4 — Genuinely Christ-centered, but the move is asserted rather than traced, or arrives at the end rather than governing the argument.
- 3 — Christ is present and honored. The path from text to Christ is a jump the hearer takes on the preacher's authority.
- 2 — Christ appended. The sermon's actual argument resolves without him.
- 1 — Moralism, or Christ as example only.`;

/** Present in arm A, and must stay present in arm B. The gate is not the variable. */
const GATE_MARKER =
  "**REQUIRED per-criterion strength gate (procedural — run while scoring, not part of JSON):**";
const WITHHOLD_MARKER = "**Withholding a deserved 5 is a scoring error.**";

/**
 * Mechanisms from docs/criterion-band-ladders.md that are explicitly NOT part
 * of this experiment. Any of these appearing would confound the result.
 */
const FORBIDDEN_IN_BOTH_ARMS = [
  "This is the anchor and should be the modal score for a faithful weekly sermon.",
  "**Presumption.**",
  "Overreach bar, stated deliberately high",
  "How presumptions work",
  "Do not reserve 3 for weak sermons.",
  "Could not have been executed better in this sermon",
];

function requireSingleOccurrence(haystack: string, needle: string, label: string): number {
  const first = haystack.indexOf(needle);
  if (first === -1) {
    throw new Error(
      `Arm B surgery aborted: ${label} not found. rubric.md or prompt.ts has drifted; re-read before running.`,
    );
  }
  if (haystack.indexOf(needle, first + needle.length) !== -1) {
    throw new Error(
      `Arm B surgery aborted: ${label} occurs more than once. Insertion point would be ambiguous.`,
    );
  }
  return first;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function insertBefore(prompt: string, anchor: string, block: string, label: string): string {
  const index = requireSingleOccurrence(prompt, anchor, label);
  return `${prompt.slice(0, index)}${block}\n\n${prompt.slice(index)}`;
}

function buildArmBPrompt(armA: string): string {
  if (!armA.includes(GATE_MARKER)) {
    throw new Error("Arm A no longer contains the strength gate; aborting rather than guessing.");
  }

  if (countOccurrences(armA, "Score bands for this criterion:") !== 0) {
    throw new Error(
      "Arm A already contains 'Score bands for this criterion:'. The rungs may have shipped; aborting.",
    );
  }
  if (armA.includes(CRITERION_1_RUNGS) || armA.includes(CRITERION_2_RUNGS)) {
    throw new Error("Arm A already contains the rung text; aborting.");
  }

  const withCriterion1 = insertBefore(
    armA,
    CRITERION_2_HEADER,
    CRITERION_1_RUNGS,
    "criterion 2 header (insertion point for criterion 1 rungs)",
  );
  const prompt = insertBefore(
    withCriterion1,
    CRITERION_3_HEADER,
    CRITERION_2_RUNGS,
    "criterion 3 header (insertion point for criterion 2 rungs)",
  );

  const expectedLength =
    armA.length + CRITERION_1_RUNGS.length + CRITERION_2_RUNGS.length + 4;
  if (prompt.length !== expectedLength) {
    throw new Error(
      `Arm B surgery aborted: length check failed (${prompt.length} vs expected ${expectedLength}).`,
    );
  }

  if (countOccurrences(prompt, CRITERION_1_RUNGS) !== 1) {
    throw new Error("Arm B surgery aborted: criterion 1 rungs do not appear exactly once.");
  }
  if (countOccurrences(prompt, CRITERION_2_RUNGS) !== 1) {
    throw new Error("Arm B surgery aborted: criterion 2 rungs do not appear exactly once.");
  }
  if (countOccurrences(prompt, "Score bands for this criterion:") !== 2) {
    throw new Error(
      "Arm B surgery aborted: expected exactly two rung blocks, found a different count.",
    );
  }

  // The gate is held constant, not removed.
  if (!prompt.includes(GATE_MARKER) || !prompt.includes(WITHHOLD_MARKER)) {
    throw new Error(
      "Arm B surgery aborted: the strength gate or withholding sentence went missing. Both arms must keep them.",
    );
  }

  // No other ladder mechanism may leak in.
  for (const arm of [armA, prompt]) {
    for (const forbidden of FORBIDDEN_IN_BOTH_ARMS) {
      if (arm.includes(forbidden)) {
        throw new Error(
          `Aborted: a mechanism outside this experiment is present (${JSON.stringify(forbidden.slice(0, 50))}).`,
        );
      }
    }
  }

  // Criterion 1's rungs must land inside criterion 1's block, and criterion 2's
  // inside criterion 2's. Verify ordering rather than trusting the anchors.
  const c1RungIdx = prompt.indexOf(CRITERION_1_RUNGS);
  const c2HeaderIdx = prompt.indexOf(CRITERION_2_HEADER);
  const c2RungIdx = prompt.indexOf(CRITERION_2_RUNGS);
  const c3HeaderIdx = prompt.indexOf(CRITERION_3_HEADER);
  const c1HeaderIdx = prompt.indexOf(
    "**1. Textual fidelity & exegesis** *(Simeon Trust, Expositional Preaching)*",
  );
  const ordered =
    c1HeaderIdx < c1RungIdx &&
    c1RungIdx < c2HeaderIdx &&
    c2HeaderIdx < c2RungIdx &&
    c2RungIdx < c3HeaderIdx;
  if (!ordered) {
    throw new Error("Arm B surgery aborted: rungs are not positioned inside their own blocks.");
  }

  return prompt;
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
// Formatting
// ---------------------------------------------------------------------------

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function padLeft(value: string, width: number): string {
  return value.length >= width ? value : " ".repeat(width - value.length) + value;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, n) => sum + n, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function spread(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}

function signed(value: number): string {
  const rounded = Number(value.toFixed(2));
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

/** Band appearing most often across the three runs; null when all three differ. */
function majorityBand(bands: string[]): string | null {
  const counts = new Map<string, number>();
  for (const band of bands) counts.set(band, (counts.get(band) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [band, count] of counts) {
    if (count > bestCount) {
      best = band;
      bestCount = count;
    }
  }
  return bestCount >= 2 ? best : null;
}

// ---------------------------------------------------------------------------
// Corpus load
// ---------------------------------------------------------------------------

type LoadedSermon = PinnedSermon & {
  sermonId: string;
  title: string;
  primaryPassage: string | null;
  manuscript: string;
  manuscriptChars: number;
};

async function loadPinnedSermons(): Promise<LoadedSermon[]> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const versionIds = PINNED_SERMONS.map((row) => row.sermonVersionId);

  const { data: versions, error: versionError } = await supabase
    .from("sermon_versions")
    .select("id, sermon_id, content")
    .in("id", versionIds);

  if (versionError) throw new Error(versionError.message);

  const versionById = new Map((versions ?? []).map((row) => [row.id as string, row]));

  const sermonIds = Array.from(
    new Set(
      (versions ?? [])
        .map((row) => row.sermon_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  );

  const { data: sermons, error: sermonError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage")
    .in("id", sermonIds);

  if (sermonError) throw new Error(sermonError.message);

  const sermonById = new Map((sermons ?? []).map((row) => [row.id as string, row]));

  const loaded: LoadedSermon[] = [];
  for (const pinned of PINNED_SERMONS) {
    const version = versionById.get(pinned.sermonVersionId);
    if (!version) {
      throw new Error(`sermon_versions row not found: ${pinned.sermonVersionId}`);
    }
    const sermon = sermonById.get(version.sermon_id as string);
    if (!sermon) {
      throw new Error(`sermons row not found for version ${pinned.sermonVersionId}`);
    }

    const manuscript = typeof version.content === "string" ? version.content : "";
    const actualSha = sha256(manuscript);
    if (actualSha !== pinned.manuscriptSha256) {
      throw new Error(
        `Manuscript changed for ${pinned.label}: sha256 ${actualSha} does not match the pinned ${pinned.manuscriptSha256}. This run would not be comparable to the gate-removal run.`,
      );
    }

    loaded.push({
      ...pinned,
      sermonId: sermon.id as string,
      title: sermon.title as string,
      primaryPassage: (sermon.primary_passage as string | null) ?? null,
      manuscript,
      manuscriptChars: manuscript.length,
    });
  }

  return loaded;
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

type RunRecord = {
  arm: Arm;
  run: number;
  sermon_index: number;
  sermon_version_id: string;
  title: string;
  api_model: string;
  api_calls: number;
  system_prompt_sha256: string;
  composite_simple: number;
  composite_weighted: number;
  band: string;
  display_10: number;
  criterion_scores: Record<number, number>;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  elapsed_ms: number;
};

function criterionScoreMap(result: EvaluationResultStrict): Record<number, number> {
  const scores: Record<number, number> = {};
  for (const category of result.categories) {
    for (const criterion of category.criteria) {
      scores[criterion.id] = criterion.score;
    }
  }
  return scores;
}

function estimateInputTokens(systemPrompt: string, userMessage: string): number {
  const tools = JSON.stringify(submitSermonEvaluationTool);
  return Math.ceil(
    (systemPrompt.length + userMessage.length + tools.length) / CHARS_PER_TOKEN,
  );
}

function triple(runs: RunRecord[], sermonIndex: number, arm: Arm, criterionId: number): number[] {
  return runs
    .filter((run) => run.sermon_index === sermonIndex && run.arm === arm)
    .sort((a, b) => a.run - b.run)
    .map((run) => run.criterion_scores[criterionId])
    .filter((score): score is number => typeof score === "number");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  loadEnvLocalIfPresent();

  const armAPrompt = buildSystemPrompt();
  const armBPrompt = buildArmBPrompt(armAPrompt);
  const promptsByArm: Record<Arm, string> = { A: armAPrompt, B: armBPrompt };

  console.log("Shadow run: band rungs on criteria 1 and 2 (no DB writes, nothing ships)");
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
    `Inserted: ${CRITERION_1_RUNGS.length} chars of criterion 1 rungs, ${CRITERION_2_RUNGS.length} chars of criterion 2 rungs`,
  );
  console.log(
    `Delta: +${armBPrompt.length - armAPrompt.length} chars, roughly ${Math.round((armBPrompt.length - armAPrompt.length) / CHARS_PER_TOKEN)} tokens`,
  );
  console.log("Held constant in both arms: strength gate, withholding sentence.");
  console.log(
    "Deliberately absent from both arms: general ladder, presumptions, overreach bar.",
  );
  console.log(
    `Arm A sha256 matches the gate-removal run's arm A: ${sha256(armAPrompt) === "580b1c52e735836cc139bacc69b96dc3222834ac04e1b0825b1ddffda86aa806"}`,
  );

  if (args.verifyPrompts) {
    console.log("");
    console.log("INSERTED BLOCK 1 — criterion 1 rungs");
    console.log("=".repeat(96));
    console.log(CRITERION_1_RUNGS);
    console.log("");
    console.log("INSERTED BLOCK 2 — criterion 2 rungs");
    console.log("=".repeat(96));
    console.log(CRITERION_2_RUNGS);
    console.log("");
    console.log("All arm B assertions passed. --verify-prompts made no API or DB calls.");
    return;
  }

  const sermons = await loadPinnedSermons();

  console.log("");
  console.log("PINNED CORPUS (same six sermons as the gate-removal run)");
  console.log("-".repeat(96));
  console.log(
    [pad("#", 3), pad("title", 32), pad("passage", 18), padLeft("chars", 7), pad("sha256 ok", 10)].join("  "),
  );
  for (const sermon of sermons) {
    console.log(
      [
        pad(String(sermon.index), 3),
        pad(sermon.title.slice(0, 32), 32),
        pad((sermon.primaryPassage ?? "(none)").slice(0, 18), 18),
        padLeft(String(sermon.manuscriptChars), 7),
        pad("verified", 10),
      ].join("  "),
    );
  }

  if (args.selectOnly) {
    console.log("");
    console.log("--select-only: not calling the API.");
    return;
  }

  requireEnv("ANTHROPIC_API_KEY");

  console.log("");
  console.log("COST PRE-ESTIMATE");
  console.log("-".repeat(96));
  let totalEstimate = 0;
  for (const sermon of sermons) {
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
      totalEstimate += (cost ?? 0) * RUNS_PER_ARM;
    }
  }
  const runCount = sermons.length * ARMS.length * RUNS_PER_ARM;
  console.log(
    `${runCount} runs (${sermons.length} sermons × ${ARMS.length} arms × ${RUNS_PER_ARM} runs)`,
  );
  console.log(`  Total: ~$${totalEstimate.toFixed(2)}  (upper bound; assumes no prefix caching)`);
  console.log(
    `  Abort threshold: $${COST_ABORT_USD.toFixed(2)}${args.force ? " (--force set, threshold ignored)" : ""}`,
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

  // Arms interleave within each replicate so slow API drift cannot land on one
  // arm, and so both cached prefixes stay warm.
  for (const sermon of sermons) {
    for (let run = 1; run <= RUNS_PER_ARM; run++) {
      for (const arm of ARMS) {
        const systemPrompt = promptsByArm[arm];
        let apiCalls = 0;
        let sentPromptSha = "";

        const createMessage = async (
          params: Anthropic.Messages.MessageCreateParamsNonStreaming,
        ) => {
          apiCalls += 1;
          const system = params.system;
          if (!Array.isArray(system) || system.length !== 1 || system[0].type !== "text") {
            throw new Error("Unexpected system block shape from runEvaluation; aborting.");
          }
          if (system[0].text !== armAPrompt) {
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

        const runLabel = `sermon ${sermon.index}/${sermons.length} arm ${arm} run ${run}/${RUNS_PER_ARM}`;
        console.log("");
        console.log(`Running ${runLabel}: ${sermon.title.slice(0, 40)}`);

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

        const scores = criterionScoreMap(result);

        runs.push({
          arm,
          run,
          sermon_index: sermon.index,
          sermon_version_id: sermon.sermonVersionId,
          title: sermon.title,
          api_model: apiModel,
          api_calls: apiCalls,
          system_prompt_sha256: sentPromptSha,
          composite_simple: result.scoring.composite_simple,
          composite_weighted: result.scoring.composite_weighted,
          band: result.scoring.band,
          display_10: Number(formatDisplayScoreBare(result.scoring.composite_weighted)),
          criterion_scores: scores,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: cost,
          elapsed_ms: elapsedMs,
        });

        console.log(
          `  c1=${scores[1]} c2=${scores[2]}  ${result.scoring.composite_weighted}/55 weighted, ${result.scoring.composite_simple}/55 simple, ${result.scoring.band}  ${apiModel}  ${elapsedMs}ms`,
        );
      }
    }
  }

  printResults(sermons, runs);

  const outDir = join(process.cwd(), ".tmp-verify");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(outDir, `shadow-ladder-rungs-${stamp}.json`);

  const payload = {
    experiment: "ladder-rungs-criteria-1-and-2",
    prompt_version: EVALUATION_PROMPT_VERSION,
    model: MODEL,
    runs_per_arm: RUNS_PER_ARM,
    arms: {
      A: {
        description: "buildSystemPrompt() byte-for-byte, gate included",
        system_prompt_sha256: sha256(armAPrompt),
        system_prompt_chars: armAPrompt.length,
      },
      B: {
        description:
          "arm A plus band rungs appended to the criterion 1 and criterion 2 blocks; gate retained",
        system_prompt_sha256: sha256(armBPrompt),
        system_prompt_chars: armBPrompt.length,
        inserted_criterion_1_rungs: CRITERION_1_RUNGS,
        inserted_criterion_2_rungs: CRITERION_2_RUNGS,
      },
    },
    held_constant: ["strength gate", "withholding sentence"],
    deliberately_absent: ["general ladder", "presumptions", "overreach bar"],
    corpus: sermons.map((sermon) => ({
      index: sermon.index,
      sermon_id: sermon.sermonId,
      sermon_version_id: sermon.sermonVersionId,
      title: sermon.title,
      primary_passage: sermon.primaryPassage,
      manuscript_sha256: sermon.manuscriptSha256,
      manuscript_chars: sermon.manuscriptChars,
    })),
    runs,
    aggregates: buildAggregates(sermons, runs),
    estimated_cost_usd: Number(totalEstimate.toFixed(4)),
    actual_cost_usd_upper_bound: Number(actualCost.toFixed(4)),
  };

  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`Wrote ${outPath}`);
  console.log(
    `Actual API cost (upper bound, cache tiers not separated): $${actualCost.toFixed(2)}`,
  );
  console.log("No rows were inserted or updated in any table.");
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function buildAggregates(sermons: LoadedSermon[], runs: RunRecord[]) {
  const armRuns = (arm: Arm) => runs.filter((run) => run.arm === arm);

  const countScore = (arm: Arm, criterionId: number, target: number) =>
    armRuns(arm).filter((run) => run.criterion_scores[criterionId] === target).length;

  const perSermonCriterion = sermons.flatMap((sermon) =>
    TEST_CRITERIA.map((criterionId) => {
      const a = triple(runs, sermon.index, "A", criterionId);
      const b = triple(runs, sermon.index, "B", criterionId);
      const spreadA = spread(a);
      const spreadB = spread(b);
      const shift = median(b) - median(a);
      const noiseFloor = Math.max(spreadA, spreadB);
      const rangesDisjoint =
        a.length > 0 && b.length > 0 &&
        (Math.min(...a) > Math.max(...b) || Math.min(...b) > Math.max(...a));
      return {
        sermon_index: sermon.index,
        title: sermon.title,
        criterion_id: criterionId,
        criterion_name: CANONICAL_CRITERION_BY_ID[criterionId] ?? `(id ${criterionId})`,
        arm_a_triple: a,
        arm_b_triple: b,
        arm_a_spread: spreadA,
        arm_b_spread: spreadB,
        median_shift: shift,
        noise_floor: noiseFloor,
        exceeds_noise_floor: Math.abs(shift) > noiseFloor,
        ranges_disjoint: rangesDisjoint,
      };
    }),
  );

  const allCriterionSpreads: Array<{
    sermon_index: number;
    criterion_id: number;
    arm_a_spread: number;
    arm_b_spread: number;
  }> = [];
  for (const sermon of sermons) {
    for (let id = 1; id <= 11; id++) {
      allCriterionSpreads.push({
        sermon_index: sermon.index,
        criterion_id: id,
        arm_a_spread: spread(triple(runs, sermon.index, "A", id)),
        arm_b_spread: spread(triple(runs, sermon.index, "B", id)),
      });
    }
  }

  const bandMajority = sermons.map((sermon) => {
    const bandsA = armRuns("A")
      .filter((run) => run.sermon_index === sermon.index)
      .map((run) => run.band);
    const bandsB = armRuns("B")
      .filter((run) => run.sermon_index === sermon.index)
      .map((run) => run.band);
    const a = majorityBand(bandsA);
    const b = majorityBand(bandsB);
    return {
      sermon_index: sermon.index,
      title: sermon.title,
      arm_a_bands: bandsA,
      arm_b_bands: bandsB,
      arm_a_majority: a,
      arm_b_majority: b,
      changed: a != null && b != null && a !== b,
      no_majority: a == null || b == null,
    };
  });

  const divergence = (arm: Arm) => {
    const rows = armRuns(arm);
    const deltas = rows.map((run) => Math.abs(run.composite_weighted - run.composite_simple));
    const identical = deltas.filter((delta) => delta === 0).length;
    const withinOne = deltas.filter((delta) => delta <= 1).length;
    return {
      runs: rows.length,
      identical,
      identical_pct: rows.length ? Number(((identical / rows.length) * 100).toFixed(1)) : 0,
      within_one: withinOne,
      within_one_pct: rows.length ? Number(((withinOne / rows.length) * 100).toFixed(1)) : 0,
      mean_abs_delta: Number(mean(deltas).toFixed(2)),
      max_abs_delta: deltas.length ? Math.max(...deltas) : 0,
    };
  };

  return {
    criterion_1_fours: { A: countScore("A", 1, 4), B: countScore("B", 1, 4) },
    criterion_1_full: {
      A: [1, 2, 3, 4, 5].map((score) => countScore("A", 1, score)),
      B: [1, 2, 3, 4, 5].map((score) => countScore("B", 1, score)),
    },
    criterion_2_fives: { A: countScore("A", 2, 5), B: countScore("B", 2, 5) },
    criterion_2_full: {
      A: [1, 2, 3, 4, 5].map((score) => countScore("A", 2, score)),
      B: [1, 2, 3, 4, 5].map((score) => countScore("B", 2, score)),
    },
    per_sermon_criterion: perSermonCriterion,
    all_criterion_within_arm_spreads: allCriterionSpreads,
    mean_composite_weighted: {
      A: Number(mean(armRuns("A").map((run) => run.composite_weighted)).toFixed(2)),
      B: Number(mean(armRuns("B").map((run) => run.composite_weighted)).toFixed(2)),
    },
    mean_composite_simple: {
      A: Number(mean(armRuns("A").map((run) => run.composite_simple)).toFixed(2)),
      B: Number(mean(armRuns("B").map((run) => run.composite_simple)).toFixed(2)),
    },
    band_majority: bandMajority,
    band_changes_by_majority: bandMajority.filter((row) => row.changed).length,
    simple_vs_weighted_divergence: { A: divergence("A"), B: divergence("B") },
  };
}

function printResults(sermons: LoadedSermon[], runs: RunRecord[]): void {
  const agg = buildAggregates(sermons, runs);

  for (const criterionId of TEST_CRITERIA) {
    console.log("");
    console.log("=".repeat(96));
    console.log(
      `CRITERION ${criterionId}: ${CANONICAL_CRITERION_BY_ID[criterionId]} — raw triples`,
    );
    console.log("=".repeat(96));
    console.log(
      [
        pad("#", 3),
        pad("sermon", 30),
        pad("arm A (3 runs)", 16),
        pad("arm B (3 runs)", 16),
        padLeft("sprA", 5),
        padLeft("sprB", 5),
        padLeft("shift", 6),
        pad("verdict", 18),
      ].join("  "),
    );
    console.log("-".repeat(110));

    for (const row of agg.per_sermon_criterion.filter((r) => r.criterion_id === criterionId)) {
      const verdict = row.exceeds_noise_floor
        ? "EXCEEDS noise"
        : row.median_shift === 0
          ? "no shift"
          : "within noise";
      console.log(
        [
          pad(String(row.sermon_index), 3),
          pad(row.title.slice(0, 30), 30),
          pad(`(${row.arm_a_triple.join(", ")})`, 16),
          pad(`(${row.arm_b_triple.join(", ")})`, 16),
          padLeft(String(row.arm_a_spread), 5),
          padLeft(String(row.arm_b_spread), 5),
          padLeft(signed(row.median_shift), 6),
          pad(verdict, 18),
        ].join("  "),
      );
    }
  }

  console.log("");
  console.log("=".repeat(96));
  console.log("WITHIN-ARM SPREAD, ALL 11 CRITERIA — the measured noise floor for this corpus");
  console.log("=".repeat(96));
  console.log(
    [pad("id", 3), pad("criterion", 34), pad("arm A spreads by sermon", 26), pad("arm B spreads by sermon", 26), padLeft("meanA", 6), padLeft("meanB", 6)].join("  "),
  );
  console.log("-".repeat(110));
  for (let id = 1; id <= 11; id++) {
    const rows = agg.all_criterion_within_arm_spreads.filter((r) => r.criterion_id === id);
    const aList = rows.map((r) => r.arm_a_spread);
    const bList = rows.map((r) => r.arm_b_spread);
    console.log(
      [
        pad(String(id), 3),
        pad((CANONICAL_CRITERION_BY_ID[id] ?? `(id ${id})`).slice(0, 34), 34),
        pad(aList.join(" "), 26),
        pad(bList.join(" "), 26),
        padLeft(mean(aList).toFixed(2), 6),
        padLeft(mean(bList).toFixed(2), 6),
      ].join("  "),
    );
  }

  console.log("");
  console.log("=".repeat(96));
  console.log("AGGREGATES");
  console.log("=".repeat(96));

  const total = sermons.length * 3;
  console.log("");
  console.log(`1. Criterion 1, count of 4s across ${total} runs per arm`);
  console.log(`   A: ${agg.criterion_1_fours.A}/${total}   full distribution 1-5: [${agg.criterion_1_full.A.join(", ")}]`);
  console.log(`   B: ${agg.criterion_1_fours.B}/${total}   full distribution 1-5: [${agg.criterion_1_full.B.join(", ")}]`);

  console.log("");
  console.log(`2. Criterion 2, count of 5s across ${total} runs per arm`);
  console.log(`   A: ${agg.criterion_2_fives.A}/${total}   full distribution 1-5: [${agg.criterion_2_full.A.join(", ")}]`);
  console.log(`   B: ${agg.criterion_2_fives.B}/${total}   full distribution 1-5: [${agg.criterion_2_full.B.join(", ")}]`);

  console.log("");
  console.log("3. Mean composite_weighted");
  console.log(`   A: ${agg.mean_composite_weighted.A}/55`);
  console.log(`   B: ${agg.mean_composite_weighted.B}/55`);
  console.log(
    `   delta: ${signed(agg.mean_composite_weighted.B - agg.mean_composite_weighted.A)}`,
  );
  console.log(
    `   mean composite_simple  A: ${agg.mean_composite_simple.A}  B: ${agg.mean_composite_simple.B}`,
  );

  console.log("");
  console.log("4. Band changes by majority of three runs");
  console.log(`   ${agg.band_changes_by_majority} of ${sermons.length} sermons changed band`);
  for (const row of agg.band_majority) {
    const flag = row.changed ? "CHANGED" : row.no_majority ? "no majority" : "same";
    console.log(
      `     ${row.sermon_index} ${pad(row.title.slice(0, 28), 28)} A [${row.arm_a_bands.join(", ")}] -> majority ${row.arm_a_majority ?? "none"}`,
    );
    console.log(
      `       ${" ".repeat(29)} B [${row.arm_b_bands.join(", ")}] -> majority ${row.arm_b_majority ?? "none"}  ${flag}`,
    );
  }

  console.log("");
  console.log("5. composite_simple vs composite_weighted divergence");
  for (const arm of ARMS) {
    const d = agg.simple_vs_weighted_divergence[arm];
    console.log(
      `   ${arm}: identical on ${d.identical}/${d.runs} (${d.identical_pct}%), within one on ${d.within_one}/${d.runs} (${d.within_one_pct}%), mean abs delta ${d.mean_abs_delta}, max ${d.max_abs_delta}`,
    );
  }

  console.log("");
  console.log("6. Decision rule applied (shift counts only if it exceeds within-arm spread)");
  for (const row of agg.per_sermon_criterion) {
    console.log(
      `   c${row.criterion_id} sermon ${row.sermon_index} ${pad(row.title.slice(0, 26), 26)} A(${row.arm_a_triple.join(",")}) B(${row.arm_b_triple.join(",")})  shift ${signed(row.median_shift)}  floor ${row.noise_floor}  ${row.exceeds_noise_floor ? "FINDING" : "noise"}${row.ranges_disjoint ? "  ranges disjoint" : ""}`,
    );
  }
  const findings = agg.per_sermon_criterion.filter((row) => row.exceeds_noise_floor).length;
  console.log("");
  console.log(
    `   ${findings} of ${agg.per_sermon_criterion.length} sermon-criterion cells exceed their own noise floor.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
