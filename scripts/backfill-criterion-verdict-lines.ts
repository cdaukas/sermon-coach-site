/**
 * Backfill criterion verdict_line on stored sermon_evaluations.result JSON.
 *
 * Offline, read-only against narratives; writes only verdict_line via full JSON
 * replace of the result object (no other fields touched in spirit — merge keys only).
 *
 * Safety:
 *   - Dry-run is the default (logs intended updates, writes nothing).
 *   - Explicit --apply is required to mutate rows.
 *   - Idempotent by default: skips evaluations whose criteria already all have
 *     a non-empty verdict_line.
 *   - --force: re-run Haiku and overwrite existing non-empty verdict_lines
 *     (still dry-run unless --apply is also passed).
 *   - Logs pass failures per evaluation and continues the run.
 *
 * Env:
 *   ANTHROPIC_API_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage:
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --dry-run
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --apply
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --apply --limit 5
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --force
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --apply --force
 *   npx tsx scripts/backfill-criterion-verdict-lines.ts --apply --force --limit 5
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  evaluationResultSchemaForPromptVersion,
  type EvaluationResultStrict,
} from "../src/lib/evaluation/schema";
import { runCriterionVerdictLines } from "../src/lib/evaluation/runCriterionVerdictLines";

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
  apply: boolean;
  force: boolean;
  limit: number | null;
} {
  const tokens = argv.slice(2);
  let sawApply = false;
  let sawDryRun = false;
  let force = false;
  let limit: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token === "--apply") {
      sawApply = true;
      continue;
    }
    if (token === "--dry-run") {
      sawDryRun = true;
      continue;
    }
    if (token === "--force") {
      force = true;
      continue;
    }
    if (token === "--limit") {
      const raw = tokens[++i];
      const n = raw ? Number.parseInt(raw, 10) : NaN;
      if (!Number.isFinite(n) || n < 1) {
        console.error("--limit requires a positive integer");
        process.exit(1);
      }
      limit = n;
      continue;
    }
    console.error(`Unknown argument: ${token}`);
    console.error(
      "Usage: npx tsx scripts/backfill-criterion-verdict-lines.ts [--dry-run] [--apply] [--force] [--limit N]",
    );
    process.exit(1);
  }

  // --dry-run wins over --apply if both are passed.
  const apply = sawDryRun ? false : sawApply;
  return { apply, force, limit };
}

function criteriaNeedVerdictLines(result: EvaluationResultStrict): boolean {
  for (const category of result.categories) {
    for (const c of category.criteria) {
      const line = c.verdict_line;
      if (line == null || line.trim() === "") return true;
    }
  }
  return false;
}

function countFilled(result: EvaluationResultStrict): number {
  let n = 0;
  for (const category of result.categories) {
    for (const c of category.criteria) {
      if (c.verdict_line?.trim()) n += 1;
    }
  }
  return n;
}

function printVerdictLines(result: EvaluationResultStrict): void {
  const rows: { id: number; name: string; verdict_line: string | null }[] =
    [];
  for (const category of result.categories) {
    for (const c of category.criteria) {
      rows.push({
        id: c.id,
        name: c.name,
        verdict_line: c.verdict_line?.trim() ? c.verdict_line : null,
      });
    }
  }
  rows.sort((a, b) => a.id - b.id);
  for (const row of rows) {
    console.log(
      `  [${row.id}] ${row.name}: ${row.verdict_line ?? "(null)"}`,
    );
  }
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();
  const { apply, force, limit } = parseArgs(process.argv);

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("ANTHROPIC_API_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    apply
      ? "Mode: APPLY (will write verdict_line only via result JSON merge)"
      : "Mode: DRY-RUN (no writes)",
  );
  if (force) {
    console.log(
      "Force: ON (re-run and overwrite existing non-empty verdict_lines)",
    );
  }
  if (limit != null) console.log(`Limit: ${limit} evaluation(s)`);

  const { data: rows, error } = await supabase
    .from("sermon_evaluations")
    .select("id, prompt_version, result, status")
    .eq("status", "complete")
    .not("result", "is", null)
    .order("completed_at", { ascending: true });

  if (error) {
    console.error("Failed to load evaluations:", error.message);
    process.exit(1);
  }

  let candidates = rows ?? [];

  let scanned = 0;
  let skipped = 0;
  let wouldUpdate = 0;
  let updated = 0;
  let failed = 0;
  let processed = 0;

  for (const row of candidates) {
    if (limit != null && processed >= limit) break;

    scanned += 1;
    const promptVersion =
      typeof row.prompt_version === "string" ? row.prompt_version : null;
    // Read schema always tolerates missing verdict_line (field presence, not version).
    const schema = evaluationResultSchemaForPromptVersion(promptVersion);
    const parsed = schema.safeParse(row.result);
    if (!parsed.success) {
      const head = parsed.error.issues[0];
      const path = head ? head.path.join(".") : "(root)";
      console.warn(
        `[skip] ${row.id}: result failed schema parse` +
          (head
            ? ` — path=${path || "(root)"} code=${head.code} ${head.message}`
            : ""),
      );
      skipped += 1;
      continue;
    }

    const result = parsed.data as EvaluationResultStrict;
    if (!force && !criteriaNeedVerdictLines(result)) {
      console.log(`[skip] ${row.id}: already has all eleven verdict lines`);
      skipped += 1;
      continue;
    }

    processed += 1;
    const priorFilled = countFilled(result);
    console.log(
      force && priorFilled === 11
        ? `[run] ${row.id} (force re-run; had ${priorFilled}/11)…`
        : `[run] ${row.id} (filled ${priorFilled}/11)…`,
    );

    try {
      const pass = await runCriterionVerdictLines(result);
      const merged = pass.result;
      const filled = countFilled(merged);
      if (filled < 11) {
        console.warn(
          `[warn] ${row.id}: only ${filled}/11 lines after pass; writing anyway`,
        );
      }

      wouldUpdate += 1;
      if (!apply) {
        console.log(
          `[dry-run] ${row.id}: would write ${filled}/11 lines (haiku tokens in=${pass.inputTokens} out=${pass.outputTokens})`,
        );
        printVerdictLines(merged);
        continue;
      }

      const { error: updateError } = await supabase
        .from("sermon_evaluations")
        .update({ result: merged })
        .eq("id", row.id)
        .eq("status", "complete");

      if (updateError) {
        console.error(`[fail] ${row.id}: update ${updateError.message}`);
        failed += 1;
        continue;
      }

      updated += 1;
      console.log(`[ok] ${row.id}: wrote ${filled}/11 lines`);
    } catch (err) {
      failed += 1;
      console.error(`[fail] ${row.id}:`, err);
      // Leave the row unchanged on offline failure (idempotent retry later).
    }
  }

  console.log("");
  console.log(
    JSON.stringify(
      {
        scanned,
        skipped,
        processed,
        wouldUpdate,
        updated,
        failed,
        apply,
        force,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
