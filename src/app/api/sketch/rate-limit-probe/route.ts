/**
 * TEMPORARY verification route for sketch rate-limit substrate.
 * Delete before merge — not part of the product surface.
 *
 * POST /api/sketch/rate-limit-probe
 * Body:
 *   { mode: "check", ip: string, action: "run"|"save", tableName?: string }
 *   { mode: "ip", }  — returns getClientIp(request)
 *   { mode: "record", ip: string, action: "run"|"save" }
 */
import { NextResponse } from "next/server";
import {
  checkSketchRateLimit,
  getClientIp,
  recordSketchEvent,
  type SketchRateAction,
} from "@/lib/sketch/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = String(body.mode ?? "");

  if (mode === "ip") {
    return NextResponse.json({ ip: getClientIp(request) });
  }

  if (mode === "check") {
    const ip = String(body.ip ?? "").trim();
    const action = String(body.action ?? "") as SketchRateAction;
    if (!ip || (action !== "run" && action !== "save")) {
      return NextResponse.json({ error: "ip and action required" }, { status: 400 });
    }
    const tableName =
      typeof body.tableName === "string" && body.tableName.trim()
        ? body.tableName.trim()
        : undefined;
    const result = await checkSketchRateLimit(ip, action, { tableName });
    return NextResponse.json(result);
  }

  if (mode === "record") {
    const ip = String(body.ip ?? "").trim();
    const action = String(body.action ?? "") as SketchRateAction;
    if (!ip || (action !== "run" && action !== "save")) {
      return NextResponse.json({ error: "ip and action required" }, { status: 400 });
    }
    await recordSketchEvent(ip, action);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
}
