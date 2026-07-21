// POST /api/sketch/save
// Stage an anonymous Sketch read for later claim. No session required.
// Writes via service role only — sketch_claims has RLS on and zero policies.

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  SKETCH_CLAIM_COOKIE,
  sketchClaimCookieOptions,
} from "@/lib/sketch/claim";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const FIELDS = [
  "ache",
  "big_idea",
  "gospel_turn",
  "points",
  "one_person",
  "ending",
] as const;

type Field = (typeof FIELDS)[number];

const STATUSES = new Set(["solid", "thin", "seam"]);
const MODES = new Set(["find", "press"]);
const HUBS = new Set([
  "ache",
  "big_idea",
  "gospel_turn",
  "points",
  "one_person",
  "ending",
]);

function asTrimmedString(value: unknown): string {
  return String(value ?? "").trim();
}

function optionalStatus(value: unknown): string | null {
  const v = asTrimmedString(value).toLowerCase();
  return STATUSES.has(v) ? v : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = {} as Record<Field, string>;
  const missing: Field[] = [];
  for (const f of FIELDS) {
    const v = asTrimmedString(body[f]);
    if (!v) missing.push(f);
    answers[f] = v;
  }

  const readOutput = asTrimmedString(body.read_output);
  const promptVersion = asTrimmedString(body.prompt_version);

  if (missing.length || !readOutput || !promptVersion) {
    return NextResponse.json(
      {
        error: "Six answers, read_output, and prompt_version are required.",
        missing,
      },
      { status: 400 },
    );
  }

  const primaryPassage = asTrimmedString(body.primary_passage) || null;

  const modeRaw = asTrimmedString(body.mode).toLowerCase();
  const mode = MODES.has(modeRaw) ? modeRaw : null;

  const status_ache = optionalStatus(body.status_ache);
  const status_big_idea = optionalStatus(body.status_big_idea);
  const status_gospel_turn = optionalStatus(body.status_gospel_turn);
  const status_points = optionalStatus(body.status_points);
  const status_one_person = optionalStatus(body.status_one_person);
  const status_ending = optionalStatus(body.status_ending);

  let seam_hub: string | null = null;
  let seam_spokes: string[] | null = null;
  const hubRaw = asTrimmedString(body.seam_hub).toLowerCase();
  if (HUBS.has(hubRaw) && Array.isArray(body.seam_spokes)) {
    const spokes = body.seam_spokes
      .map((x) => String(x).toLowerCase())
      .filter((x) => HUBS.has(x) || x === "passage")
      .filter((x) => x !== hubRaw);
    if (spokes.length > 0) {
      seam_hub = hubRaw;
      seam_spokes = [...new Set(spokes)];
    }
  }

  // Drop incoherent find/press claims so CHECK constraints do not reject the row.
  let modeOut: string | null = mode;
  if (modeOut === "find" && (!seam_hub || !seam_spokes)) {
    modeOut = null;
  }
  if (modeOut === "press") {
    seam_hub = null;
    seam_spokes = null;
  }

  const token = randomUUID();
  const admin = createAdminClient();

  // Opportunistic cleanup — no cron in this project.
  const { error: cleanupError } = await admin
    .from("sketch_claims")
    .delete()
    .lt("expires_at", new Date().toISOString());
  if (cleanupError) {
    console.error("sketch_claims expired cleanup failed", cleanupError);
  }

  const { error: insertError } = await admin.from("sketch_claims").insert({
    token,
    primary_passage: primaryPassage,
    ...answers,
    read_output: readOutput,
    prompt_version: promptVersion,
    mode: modeOut,
    status_ache,
    status_big_idea,
    status_gospel_turn,
    status_points,
    status_one_person,
    status_ending,
    seam_hub,
    seam_spokes,
  });

  if (insertError) {
    console.error("sketch_claims insert failed", insertError);
    return NextResponse.json(
      { error: "The read could not be saved. Try again." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ token });
  response.cookies.set(
    SKETCH_CLAIM_COOKIE,
    token,
    sketchClaimCookieOptions(3600),
  );
  return response;
}
