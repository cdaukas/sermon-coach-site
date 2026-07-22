// src/app/api/readiness-read/route.ts
//
// POST /api/readiness-read
// Body: { primary_passage?, outline_form?, ache, big_idea, gospel_turn, points, one_person, ending }
// outline_form: "outline" | "manuscript" — tunes closing line only
// one_person field stores THE ONE THING (Monday change); key kept for schema continuity
// Returns: { read: string, status: { ache?, big_idea?, ... } }
// Telemetry persists server-side to readiness_reads; not returned to the client.
//
// Auth matches the existing pattern in src/app/api/evaluations/[evaluationId]/route.ts:
// cookie session via createClient() from @/lib/supabase/server, then auth.getUser().
// No Authorization header, no service-role key. The anon cookie client runs AS the
// user, so the RLS policies on readiness_reads do the enforcement.
//
// Generation (prompt, model, parse) lives in @/lib/sketch/generate — shared with
// the public /api/sketch/run path so the two reads cannot drift.

import { NextResponse } from "next/server";
import {
  generateSketchRead,
  SKETCH_PROMPT_VERSION,
} from "@/lib/sketch/generate";
import { SKETCH_FIELDS, type OutlineForm } from "@/lib/sketch/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // shared generate uses readFileSync + longer model call

type Field = (typeof SKETCH_FIELDS)[number];

export async function POST(request: Request) {
  // --- auth (same shape as the evaluations route) --------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- validate ------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = {} as Record<Field, string>;
  const missing: Field[] = [];

  for (const f of SKETCH_FIELDS) {
    const v = String(body[f] ?? "").trim();
    if (!v) missing.push(f);
    answers[f] = v;
  }

  if (missing.length) {
    return NextResponse.json(
      { error: "All six answers are required.", missing },
      { status: 400 },
    );
  }

  const primaryPassage = String(body.primary_passage ?? "").trim() || null;

  const outlineFormRaw = String(body.outline_form ?? "").trim().toLowerCase();
  const outlineForm: OutlineForm | null =
    outlineFormRaw === "outline" || outlineFormRaw === "manuscript"
      ? outlineFormRaw
      : null;

  // --- generate (shared with public /api/sketch/run) -----------------------
  const generated = await generateSketchRead({
    primary_passage: primaryPassage,
    outline_form: outlineForm,
    ...answers,
  });

  if (!generated.ok) {
    return NextResponse.json({ error: generated.error }, { status: 502 });
  }

  const { read, status, telemetry } = generated;

  // --- write, but never at the preacher's expense --------------------------
  // The read is the product. Telemetry is ours. A failed insert gets logged and
  // swallowed; it must not cost him his read.
  //
  // NOTE: this awaits before responding, which adds a little latency. If this
  // repo is on Next 15+, move the insert into `after()` from "next/server" to
  // respond first and write in the background. Left inline here because it is
  // correct on every Next version and the failure mode is identical.
  try {
    const { error } = await supabase.from("readiness_reads").insert({
      user_id: user.id,
      sermon_id: null,
      primary_passage: primaryPassage,
      ...answers,
      read_output: read,
      prompt_version: SKETCH_PROMPT_VERSION,
      ...telemetry,
    });
    if (error) console.error("readiness_reads insert failed", error);
  } catch (err) {
    console.error("readiness_reads insert threw", err);
  }

  // status is the six-area object for the report table. Telemetry stays
  // server-side (DB insert above); do not return the full telemetry row.
  return NextResponse.json({ read, status });
}
