// POST /api/sketch/run
// Public Sketch generation. No session required.
// Rate-limits by IP, then runs the same generateSketchRead helper as the
// authed /api/readiness-read path. Returns { read, status } only — does not
// write readiness_reads or sketch_claims.

import { NextResponse } from "next/server";
import { generateSketchRead } from "@/lib/sketch/generate";
import {
  checkSketchRateLimit,
  getClientIp,
  recordSketchEvent,
} from "@/lib/sketch/rate-limit";
import { SKETCH_FIELDS, type OutlineForm } from "@/lib/sketch/types";

export const runtime = "nodejs";

type Field = (typeof SKETCH_FIELDS)[number];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkSketchRateLimit(ip, "run");
  if (!limit.ok) {
    return NextResponse.json({ error: "Rate limited", reason: limit.reason }, {
      status: 429,
    });
  }

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

  // Record after the limit check passes and before the expensive call so
  // the cooldown / daily counters include this attempt.
  await recordSketchEvent(ip, "run");

  const generated = await generateSketchRead({
    primary_passage: primaryPassage,
    outline_form: outlineForm,
    ...answers,
  });

  if (!generated.ok) {
    return NextResponse.json({ error: generated.error }, { status: 502 });
  }

  // Public path: response body only. No readiness_reads, no sketch_claims.
  return NextResponse.json({
    read: generated.read,
    status: generated.status,
  });
}
