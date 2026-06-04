#!/usr/bin/env node
/**
 * Verify profiles billing lock (PATCH) and consume_evaluation_credit RPC.
 *
 *   set -a && source .env.local && set +a
 *   # optional: source .env.patch-test.local for secrets
 *   export PATCH_TEST_ACCESS_TOKEN='eyJ...'   # user JWT (preferred)
 *   # OR: PATCH_TEST_EMAIL + PATCH_TEST_PASSWORD
 *   export RUN_CONSUME_SMOKE=1                 # fresh throwaway only
 *   node scripts/verify-profiles-billing-lock.mts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(name: string) {
  const path = join(process.cwd(), name);
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.patch-test.local");

const accessToken = process.env.PATCH_TEST_ACCESS_TOKEN;
const email = process.env.PATCH_TEST_EMAIL;
const password = process.env.PATCH_TEST_PASSWORD;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const billingPatches: Record<string, Record<string, unknown>> = {
  subscription_status: { subscription_status: "active" },
  free_evaluations_remaining: { free_evaluations_remaining: 99 },
  evaluations_used_this_period: { evaluations_used_this_period: 0 },
};

async function patchWithRawHttp(
  userId: string,
  jwt: string,
  label: string,
  body: Record<string, unknown>,
): Promise<void> {
  const endpoint = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
  const headers = new Headers({
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  });
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log(`\n=== PATCH ${label} ===`);
  console.log(`HTTP/${response.status} ${response.statusText}`);
  console.log(text || "(empty body)");
}

async function resolveSession(): Promise<{ userId: string; jwt: string }> {
  if (accessToken) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      console.error("PATCH_TEST_ACCESS_TOKEN invalid:", error?.message ?? "no user");
      process.exit(1);
    }
    return { userId: data.user.id, jwt: accessToken };
  }

  if (!email || !password) {
    console.error(
      "Set PATCH_TEST_ACCESS_TOKEN (user JWT) or PATCH_TEST_EMAIL + PATCH_TEST_PASSWORD in .env.patch-test.local",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error("Sign-in failed:", error?.message ?? "no session");
    process.exit(1);
  }
  return { userId: data.user!.id, jwt: data.session.access_token };
}

async function main() {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  const { error: rpcProbe } = await supabaseAnon.rpc("consume_evaluation_credit", {
    p_user_id: "00000000-0000-0000-0000-000000000000",
  });
  console.log("Migration probe (consume_evaluation_credit exists):");
  console.log(
    rpcProbe?.code === "PGRST202"
      ? "  NO — function missing (apply migration SQL first)"
      : `  YES — ${rpcProbe?.code ?? "ok"} ${rpcProbe?.message ?? ""}`,
  );

  const { userId, jwt } = await resolveSession();
  console.log(`\nAuthenticated as user ${userId}`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: before, error: readError } = await supabase
    .from("profiles")
    .select(
      "subscription_status, free_evaluations_remaining, evaluations_used_this_period, last_evaluation_at",
    )
    .eq("id", userId)
    .single();

  if (readError) {
    console.error("Profile read failed:", readError.message);
    process.exit(1);
  }

  console.log("\nProfile BEFORE PATCH attempts:", JSON.stringify(before, null, 2));

  for (const [label, patch] of Object.entries(billingPatches)) {
    await patchWithRawHttp(userId, jwt, label, patch);
  }

  const { data: after } = await supabase
    .from("profiles")
    .select(
      "subscription_status, free_evaluations_remaining, evaluations_used_this_period, last_evaluation_at",
    )
    .eq("id", userId)
    .single();

  console.log("\nProfile AFTER PATCH attempts:", JSON.stringify(after, null, 2));

  if (process.env.RUN_CONSUME_SMOKE === "1") {
    const freeBefore = before?.free_evaluations_remaining ?? 0;
    console.log("\n=== consume_evaluation_credit RPC ===");
    const { error: rpcError } = await supabase.rpc("consume_evaluation_credit", {
      p_user_id: userId,
    });
    if (rpcError) {
      console.error("RPC failed:", rpcError.code, rpcError.message);
      process.exit(1);
    }

    const { data: consumed } = await supabase
      .from("profiles")
      .select(
        "subscription_status, free_evaluations_remaining, evaluations_used_this_period, last_evaluation_at",
      )
      .eq("id", userId)
      .single();

    console.log("Profile AFTER consume:", JSON.stringify(consumed, null, 2));
    console.log(
      `\nfree_evaluations_remaining: ${freeBefore} → ${consumed?.free_evaluations_remaining}`,
    );
    console.log(`last_evaluation_at set: ${consumed?.last_evaluation_at != null}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
