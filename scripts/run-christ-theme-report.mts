/**
 * Build and persist a Christ-theme report for a user (prep-card surface).
 *
 * Usage:
 *   npx tsx scripts/run-christ-theme-report.mts [email]
 *
 * Defaults to chrisd@gtn.org. Requires .env.local with Supabase service
 * role and ANTHROPIC_API_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildChristThemeSnapshot } from "../src/lib/christ-theme/build";
import type { PrepSermonInput } from "../src/lib/prep-card/build";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  delete process.env.EVALUATION_USE_STUB;
  const email = process.argv[2]?.trim() || "chrisd@gtn.org";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    throw listError;
  }
  const user = listed.users.find(
    (row) => row.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    throw new Error(`No auth user for ${email}`);
  }

  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .eq("excluded_from_growth", false)
    .order("created_at", { ascending: false })
    .limit(24);

  if (sermonsError) {
    throw sermonsError;
  }
  if (!sermons?.length) {
    throw new Error("No sermons found");
  }

  const ids = sermons.map((s) => s.id);
  const { data: versions, error: versionsError } = await supabase
    .from("sermon_versions")
    .select("sermon_id, content, created_at")
    .in("sermon_id", ids)
    .order("created_at", { ascending: false });
  if (versionsError) {
    throw versionsError;
  }

  const latest = new Map<string, string>();
  for (const version of versions ?? []) {
    if (latest.has(version.sermon_id)) {
      continue;
    }
    if (typeof version.content === "string" && version.content.trim()) {
      latest.set(version.sermon_id, version.content);
    }
  }

  const inputs: PrepSermonInput[] = [];
  for (const sermon of [...sermons].reverse()) {
    const content = latest.get(sermon.id);
    if (!content) {
      continue;
    }
    inputs.push({
      id: sermon.id,
      title: sermon.title ?? "Sermon",
      content,
      primaryPassage:
        typeof sermon.primary_passage === "string"
          ? sermon.primary_passage
          : null,
    });
  }

  console.log(`user=${email} sermons=${inputs.length}`);
  console.log("building Christ theme snapshot (coding + rewrites)…");

  const snapshot = await buildChristThemeSnapshot(inputs);
  console.log(
    JSON.stringify(
      {
        themeId: snapshot.themeId,
        sampleSize: snapshot.sampleSize,
        strengths: snapshot.strengths,
        focus: snapshot.focus,
        unmeasuredNote: snapshot.unmeasuredNote,
        genreCaveat: snapshot.genreCaveat,
        focusExamples: snapshot.focusExamples?.map((ex) => ({
          measureId: ex.measureId,
          sermonTitle: ex.sermonTitle,
          hasRewrite: Boolean(ex.rewrite),
        })),
        strengthExamples: snapshot.strengthExamples?.length ?? 0,
      },
      null,
      2,
    ),
  );

  const { data, error } = await supabase
    .from("prep_cards")
    .insert({
      user_id: user.id,
      generated_at: snapshot.generatedAt,
      sample_size: snapshot.sampleSize,
      source_format: snapshot.sourceFormat,
      ranked_measure_count: snapshot.rankedMeasureCount,
      pool_note: snapshot.poolNote,
      snapshot,
    })
    .select("id, generated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "prep_cards insert failed");
  }

  console.log(`\ninserted prep_cards.id=${data.id}`);
  console.log("view: /dashboard/christ-theme");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
