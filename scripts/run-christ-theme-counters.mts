/**
 * Run Theme 2 C3/C4/C5 counters (+ genre caveat) on a user's sermons.
 * C1/C2 stay stubbed.
 *
 * Usage: node --import tsx scripts/run-christ-theme-counters.mts [email]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  codeCrossNamedObjects,
  measureChristAgencyInPoint,
  measureChristAgencyInProse,
  measureGospelInSkeleton,
} from "../src/lib/prep-card/counters-christ";
import { measure12AddressesNonChristian } from "../src/lib/prep-card/counters-address";
import { prepGenreCaveat } from "../src/lib/prep-card/genre";
import { detectPrepSourceFormat } from "../src/lib/prep-card/text";

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

  const USER = "381edea4-dd32-41b4-9616-8da065e1d0d2";
  const { data: sermons, error: sermonsError } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, created_at")
    .eq("user_id", USER)
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

  const inputs: Array<{
    id: string;
    title: string;
    content: string;
    primaryPassage: string | null;
  }> = [];
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
  console.log(
    "C1 stub:",
    measureChristAgencyInProse("") === null ? "null (excluded)" : "UNEXPECTED",
  );
  console.log(
    "C2 stub:",
    measureChristAgencyInPoint("") === null ? "null (excluded)" : "UNEXPECTED",
  );

  let manuscriptCount = 0;
  let transcriptCount = 0;
  let c4Hits = 0;
  let c4Eligible = 0;
  let c5Hits = 0;
  for (const sermon of inputs) {
    const format = detectPrepSourceFormat(sermon.content);
    if (format === "manuscript") {
      manuscriptCount += 1;
    } else {
      transcriptCount += 1;
    }
    const c4 = measureGospelInSkeleton(sermon.content);
    if (c4 != null) {
      c4Eligible += 1;
      if (c4) {
        c4Hits += 1;
      }
    }
    if (measure12AddressesNonChristian(sermon.content)) {
      c5Hits += 1;
    }
  }

  console.log("running C3 cross named-object coding…");
  const cross = await codeCrossNamedObjects(
    inputs.map((s) => ({ id: s.id, title: s.title, raw: s.content })),
  );
  const c3Hits = cross.filter((row) => row.namedObject).length;

  const genreCaveat = prepGenreCaveat({
    passages: inputs.map((s) => s.primaryPassage),
    sampleSize: inputs.length,
  });

  console.log("\n=== Theme 2 counters (C3 / C4 / C5) ===");
  console.log(`sample: ${inputs.length} sermons`);
  console.log(
    `format: ${manuscriptCount} manuscripts, ${transcriptCount} transcripts`,
  );
  console.log(`C1 agency in prose: stubbed (null)`);
  console.log(`C2 Christ in a main point: stubbed (null)`);
  console.log(`C3 cross named object: ${c3Hits} of ${inputs.length} sermons`);
  console.log(
    `C4 gospel in skeleton: ${c4Hits} of ${c4Eligible} manuscripts` +
      (c4Eligible < inputs.length
        ? ` (${inputs.length - c4Eligible} ineligible / transcript)`
        : ""),
  );
  console.log(
    `C5 outside the faith addressed: ${c5Hits} of ${inputs.length} sermons`,
  );
  console.log("\ngenre caveat:");
  console.log(genreCaveat ?? "(none — no primary_passage labels)");

  const c3Examples = cross
    .filter((row) => row.namedObject)
    .slice(0, 3)
    .map((row) => {
      const span = row.spans.find((s) => s.named_object);
      const title =
        inputs.find((s) => s.id === row.sermonId)?.title ?? row.sermonId;
      return { title, quote: span?.quote?.slice(0, 140) };
    });
  console.log("\nC3 sample hits:");
  console.log(JSON.stringify(c3Examples, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
