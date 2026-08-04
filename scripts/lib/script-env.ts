/**
 * Shared env + CLI helpers for offline passage-inventory scripts.
 * Not imported by the evaluation request path.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function loadEnvLocalIfPresent(): void {
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

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

export function createServiceClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function parseFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

export function parseOption(argv: string[], name: string): string | null {
  const prefix = `${name}=`;
  for (const token of argv) {
    if (token.startsWith(prefix)) {
      return token.slice(prefix.length).trim() || null;
    }
    if (token === name) {
      // support "--foo bar"
      const idx = argv.indexOf(token);
      const next = argv[idx + 1];
      if (next && !next.startsWith("--")) return next.trim();
    }
  }
  return null;
}

/** Strip accidental markdown fences then parse JSON. */
export function parseJsonObject(text: string): unknown {
  let body = text.trim();
  if (body.startsWith("```")) {
    body = body.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return JSON.parse(body);
}
