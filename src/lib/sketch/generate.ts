// Shared Sketch / readiness-read generation.
// Both /api/readiness-read (authed) and /api/sketch/run (public) call
// generateSketchRead so prompt, model, and parsing cannot drift.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SKETCH_FIELDS,
  type OutlineForm,
  type SketchField,
  type SketchStatus,
  type SketchStatusMap,
} from "@/lib/sketch/types";

export const SKETCH_PROMPT_VERSION = "v2.11";
const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = readFileSync(
  join(
    process.cwd(),
    "src",
    "lib",
    "prompts",
    `readiness-read-${SKETCH_PROMPT_VERSION}.md`,
  ),
  "utf8",
);

const LABELS: Record<SketchField, string> = {
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

const STATUSES = new Set<SketchStatus>(["solid", "thin", "seam"]);

type Mode = "find" | "press";

export type StatusDemotionRule =
  | "seam_hub"
  | "seam_disagrees_with"
  | "press_area";

/** Server-only demotion audit trail — never returned to the client. */
export type StatusDemotion = {
  area: SketchField;
  original: SketchStatus | null;
  derived: SketchStatus;
  rule: StatusDemotionRule;
};

/** Telemetry columns written to readiness_reads on the authed path only. */
export type SketchTelemetry = Partial<
  Record<`status_${SketchField}`, SketchStatus> & {
    mode: Mode;
    seam_hub: SketchField;
    seam_spokes: string[];
    /** Press mode only — no DB column; stripped before persist/client. */
    press_area: SketchField;
  }
> & {
  /** Log only — stripped before readiness_reads / sketch_claims insert and client JSON. */
  status_demotions?: StatusDemotion[];
};

/** Fields safe to spread into readiness_reads / sketch_claims / client save. */
export function telemetryForPersist(
  telemetry: SketchTelemetry,
): Omit<SketchTelemetry, "status_demotions" | "press_area"> {
  const { status_demotions: _d, press_area: _p, ...rest } = telemetry;
  return rest;
}

export type SketchGenerateInput = {
  primary_passage?: string | null;
  outline_form?: OutlineForm | null;
  ache: string;
  big_idea: string;
  gospel_turn: string;
  points: string;
  one_person: string;
  ending: string;
};

export type SketchGenerateResult =
  | {
      ok: true;
      read: string;
      status: SketchStatusMap;
      /** For readiness_reads insert only — never return to the client. */
      telemetry: SketchTelemetry;
    }
  | { ok: false; error: string };

function statusFromTelemetry(telemetry: SketchTelemetry): SketchStatusMap {
  const out: SketchStatusMap = {};
  for (const f of SKETCH_FIELDS) {
    const v = telemetry[`status_${f}`];
    if (v) out[f] = v;
  }
  return out;
}

function stripProseGlance(read: string): string {
  return read
    .replace(
      /\*\*AT A GLANCE\*\*[\s\S]*?(?=\*\*(?:WHAT'S SOLID|THE ONE THING))/i,
      "",
    )
    .trim();
}

/**
 * Split model output into the human-facing read and the telemetry row.
 *
 * Defensive on purpose: the model will occasionally trail prose after the JSON
 * or omit the block entirely. Neither should cost the preacher his read, and
 * neither should write a garbage row.
 */
function splitRead(raw: string): {
  read: string;
  telemetry: SketchTelemetry;
  status: SketchStatusMap;
} {
  const fence = /```json\s*([\s\S]*?)```/gi;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;

  while ((m = fence.exec(raw)) !== null) last = m;

  if (!last) {
    console.warn("no telemetry block emitted");
    return { read: stripProseGlance(raw), telemetry: {}, status: {} };
  }

  // Strip a leftover prose AT A GLANCE if the model still emits one —
  // the report table is driven only by the telemetry `status` object.
  const read = stripProseGlance(raw.slice(0, last.index).trim());

  let parsed: unknown;
  try {
    parsed = JSON.parse(last[1].trim());
  } catch (err) {
    console.warn("telemetry block did not parse", err);
    return { read, telemetry: {}, status: {} };
  }

  const telemetry = deriveStatuses(normalize(parsed));
  return { read, telemetry, status: statusFromTelemetry(telemetry) };
}

/**
 * Trust nothing. A bad enum fails the CHECK constraint and takes the whole
 * insert with it, so drop anything that does not belong rather than sending it.
 */
function normalize(input: unknown): SketchTelemetry {
  const out: SketchTelemetry = {};
  if (typeof input !== "object" || input === null) return out;

  const t = input as Record<string, unknown>;

  if (t.mode === "find" || t.mode === "press") out.mode = t.mode;

  const status = (t.status ?? {}) as Record<string, unknown>;
  for (const f of SKETCH_FIELDS) {
    const v = String(status[f] ?? "").toLowerCase();
    if (STATUSES.has(v as SketchStatus)) out[`status_${f}`] = v as SketchStatus;
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

  // Press hub: the one thinnest load-bearing area named in THE ONE THING TO PRESS.
  // No DB column — parse for status derivation only.
  const press = (t.press ?? null) as Record<string, unknown> | null;
  if (press) {
    const area = String(press.area ?? "").toLowerCase();
    if (isField(area)) out.press_area = area;
  }

  // A hub with no spokes is not a seam. Do not record a half-claim -- and do not
  // send mode=find to the DB without one, because the CHECK constraint will reject
  // the whole row and cost us the intake as well as the telemetry.
  if (out.mode === "find" && (!out.seam_hub || !out.seam_spokes)) {
    console.warn("mode=find with no valid seam; dropping mode to keep the row");
    delete out.mode;
  }

  // Press mode carries no seam. Drop stray hub/spokes so CHECK stays coherent.
  if (out.mode === "press") {
    delete out.seam_hub;
    delete out.seam_spokes;
  }

  // Find mode carries no press area.
  if (out.mode === "find") {
    delete out.press_area;
  }

  return out;
}

/**
 * Enforce hub/spoke and press-area arithmetic on status fields after normalize.
 * Logs demotions for readiness_reads audit (status_demotions never client-facing).
 */
export function deriveStatuses(telemetry: SketchTelemetry): SketchTelemetry {
  const out: SketchTelemetry = { ...telemetry };
  const demotions: StatusDemotion[] = [];

  const hub = out.seam_hub;
  if (hub) {
    const key = `status_${hub}` as const;
    const original = out[key] ?? null;
    if (original !== "seam") {
      demotions.push({
        area: hub,
        original,
        derived: "seam",
        rule: "seam_hub",
      });
      out[key] = "seam";
    }
  }

  for (const spoke of out.seam_spokes ?? []) {
    if (!isField(spoke)) continue;
    const key = `status_${spoke}` as const;
    const original = out[key] ?? null;
    if (original === "solid") {
      demotions.push({
        area: spoke,
        original: "solid",
        derived: "thin",
        rule: "seam_disagrees_with",
      });
      out[key] = "thin";
    }
  }

  // Press mode: the area named as the thing to press cannot stay solid.
  // Same rule as seam for find — the press section is part of the read.
  const pressArea = out.press_area;
  if (out.mode === "press" && pressArea) {
    const key = `status_${pressArea}` as const;
    const original = out[key] ?? null;
    if (original === "solid") {
      demotions.push({
        area: pressArea,
        original: "solid",
        derived: "thin",
        rule: "press_area",
      });
      out[key] = "thin";
    }
  }

  if (demotions.length > 0) {
    out.status_demotions = demotions;
    for (const d of demotions) {
      console.info("sketch status demotion", d);
    }
  } else {
    delete out.status_demotions;
  }

  return out;
}

function isField(x: string): x is SketchField {
  return (SKETCH_FIELDS as readonly string[]).includes(x);
}

function buildUserMessage(input: SketchGenerateInput): string {
  const primaryPassage = String(input.primary_passage ?? "").trim() || null;
  const outlineForm = input.outline_form ?? null;

  return [
    primaryPassage ? `THE PASSAGE\n${primaryPassage}` : null,
    outlineForm ? `OUTLINE FORM\n${OUTLINE_FORMS[outlineForm]}` : null,
    ...SKETCH_FIELDS.map((f) => `${LABELS[f]}\n${input[f]}`),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Run the Sketch readiness read. Same prompt_version, model, and parser
 * for every caller. Does not persist anything.
 */
export async function generateSketchRead(
  input: SketchGenerateInput,
): Promise<SketchGenerateResult> {
  const userContent = buildUserMessage(input);

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
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!r.ok) {
      console.error("anthropic error", r.status, await r.text());
      return { ok: false, error: "The read could not be generated. Try again." };
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
    return { ok: false, error: "The read could not be generated. Try again." };
  }

  if (!raw) {
    return { ok: false, error: "The read came back empty. Try again." };
  }

  const { read, telemetry, status } = splitRead(raw);
  return { ok: true, read, status, telemetry };
}
