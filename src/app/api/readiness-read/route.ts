// src/app/api/readiness-read/route.ts
//
// POST /api/readiness-read
// Body: { primary_passage?, outline_form?, ache, big_idea, gospel_turn, points, one_person, ending }
// outline_form: "outline" | "manuscript" — tunes closing line only
// one_person field stores THE ONE THING (Monday change); key kept for schema continuity
// Returns: { read: string }  — markdown, telemetry block stripped
//
// Auth matches the existing pattern in src/app/api/evaluations/[evaluationId]/route.ts:
// cookie session via createClient() from @/lib/supabase/server, then auth.getUser().
// No Authorization header, no service-role key. The anon cookie client runs AS the
// user, so the RLS policies on readiness_reads do the enforcement.

import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // readFileSync + longer model call

const PROMPT_VERSION = "v2.7";
const MODEL = "claude-opus-4-8";

// Read once at module scope, not per request.
const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), "src", "lib", "prompts", `readiness-read-${PROMPT_VERSION}.md`),
  "utf8",
);

const FIELDS = [
  "ache",
  "big_idea",
  "gospel_turn",
  "points",
  "one_person",
  "ending",
] as const;

type Field = (typeof FIELDS)[number];
type Status = "solid" | "thin" | "seam";
type Mode = "find" | "press";

const LABELS: Record<Field, string> = {
  ache: "THE ACHE",
  big_idea: "THE BIG IDEA",
  gospel_turn: "THE GOSPEL TURN",
  points: "THE POINTS",
  one_person: "THE ONE THING",
  ending: "THE LAST NINETY SECONDS",
};

const OUTLINE_FORMS = {
  outline: "This is the outline I'll preach from",
  manuscript: "I'm still heading toward a manuscript",
} as const;

type OutlineForm = keyof typeof OUTLINE_FORMS;

const STATUSES = new Set<Status>(["solid", "thin", "seam"]);

type Telemetry = Partial<
  Record<`status_${Field}`, Status> & {
    mode: Mode;
    seam_hub: Field;
    seam_spokes: string[];
  }
>;

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

  for (const f of FIELDS) {
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

  const intake = [
    primaryPassage ? `THE PASSAGE\n${primaryPassage}` : null,
    outlineForm
      ? `OUTLINE FORM\n${OUTLINE_FORMS[outlineForm]}`
      : null,
    ...FIELDS.map((f) => `${LABELS[f]}\n${answers[f]}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  // --- generate ------------------------------------------------------------
  let raw: string;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: intake }],
      }),
    });

    if (!r.ok) {
      console.error("anthropic error", r.status, await r.text());
      return NextResponse.json(
        { error: "The read could not be generated. Try again." },
        { status: 502 },
      );
    }

    const data = (await r.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    raw = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n")
      .trim();
  } catch (err) {
    console.error("anthropic fetch failed", err);
    return NextResponse.json(
      { error: "The read could not be generated. Try again." },
      { status: 502 },
    );
  }

  if (!raw) {
    return NextResponse.json(
      { error: "The read came back empty. Try again." },
      { status: 502 },
    );
  }

  const { read, telemetry } = splitRead(raw);

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
      prompt_version: PROMPT_VERSION,
      ...telemetry,
    });
    if (error) console.error("readiness_reads insert failed", error);
  } catch (err) {
    console.error("readiness_reads insert threw", err);
  }

  return NextResponse.json({ read });
}

// ---------------------------------------------------------------------------
// Split model output into the human-facing read and the telemetry row.
//
// Defensive on purpose: the model will occasionally trail prose after the JSON
// or omit the block entirely. Neither should cost the preacher his read, and
// neither should write a garbage row.
// ---------------------------------------------------------------------------
function splitRead(raw: string): { read: string; telemetry: Telemetry } {
  const fence = /```json\s*([\s\S]*?)```/gi;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;

  while ((m = fence.exec(raw)) !== null) last = m;

  if (!last) {
    console.warn("no telemetry block emitted");
    return { read: raw, telemetry: {} };
  }

  const read = raw.slice(0, last.index).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(last[1].trim());
  } catch (err) {
    console.warn("telemetry block did not parse", err);
    return { read, telemetry: {} };
  }

  return { read, telemetry: normalize(parsed) };
}

// Trust nothing. A bad enum fails the CHECK constraint and takes the whole
// insert with it, so drop anything that does not belong rather than sending it.
function normalize(input: unknown): Telemetry {
  const out: Telemetry = {};
  if (typeof input !== "object" || input === null) return out;

  const t = input as Record<string, unknown>;

  if (t.mode === "find" || t.mode === "press") out.mode = t.mode;

  const status = (t.status ?? {}) as Record<string, unknown>;
  for (const f of FIELDS) {
    const v = String(status[f] ?? "").toLowerCase();
    if (STATUSES.has(v as Status)) out[`status_${f}`] = v as Status;
  }

  // Hub and spokes. "passage" is a legal spoke (the self-diagnosed-point case)
  // even though it is not one of the six scored areas.
  const seam = (t.seam ?? null) as Record<string, unknown> | null;
  if (seam) {
    const hub = String(seam.hub ?? "").toLowerCase();
    const raw = Array.isArray(seam.disagrees_with) ? seam.disagrees_with : [];

    const spokes = raw
      .map((x) => String(x).toLowerCase())
      .filter((x) => isField(x) || x === "passage")
      .filter((x) => x !== hub);

    if (isField(hub) && spokes.length > 0) {
      out.seam_hub = hub;
      out.seam_spokes = [...new Set(spokes)];
    }
  }

  // A hub with no spokes is not a seam. Do not record a half-claim -- and do not
  // send mode=find to the DB without one, because the CHECK constraint will reject
  // the whole row and cost us the intake as well as the telemetry.
  if (out.mode === "find" && (!out.seam_hub || !out.seam_spokes)) {
    console.warn("mode=find with no valid seam; dropping mode to keep the row");
    delete out.mode;
  }

  return out;
}

function isField(x: string): x is Field {
  return (FIELDS as readonly string[]).includes(x);
}
