#!/usr/bin/env node
/**
 * Verify authenticated users cannot PATCH billing columns on profiles.
 * Optional: sign in and run consume_evaluation_credit smoke test.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   node scripts/verify-profiles-billing-lock.mts
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (required)
 *   PATCH_TEST_EMAIL, PATCH_TEST_PASSWORD (required for PATCH tests)
 *   RUN_CONSUME_SMOKE=1 — call consume RPC (decrements free or monthly; use throwaway)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.PATCH_TEST_EMAIL;
const password = process.env.PATCH_TEST_PASSWORD;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

if (!email || !password) {
  console.error(
    "Set PATCH_TEST_EMAIL and PATCH_TEST_PASSWORD (throwaway or test account).",
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const billingPatches: Record<string, Record<string, unknown>> = {
  subscription_status: { subscription_status: "active" },
  free_evaluations_remaining: { free_evaluations_remaining: 99 },
  evaluations_used_this_period: { evaluations_used_this_period: 0 },
};

async function main() {
  const { data: auth, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !auth.user) {
    console.error("Sign-in failed:", signInError?.message ?? "no user");
    process.exit(1);
  }

  const userId = auth.user.id;
  console.log(`Signed in as ${email} (${userId})`);

  const { data: before, error: readError } = await supabase
    .from("profiles")
    .select(
      "subscription_status, free_evaluations_remaining, evaluations_used_this_period",
    )
    .eq("id", userId)
    .single();

  if (readError) {
    console.error("Profile read failed:", readError.message);
    process.exit(1);
  }

  console.log("Profile before PATCH attempts:", before);

  let patchFailures = 0;

  for (const [label, patch] of Object.entries(billingPatches)) {
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId);

    const blocked =
      error &&
      (error.code === "42501" ||
        error.message.toLowerCase().includes("permission") ||
        error.message.toLowerCase().includes("denied") ||
        error.message.toLowerCase().includes("policy"));

    if (blocked) {
      console.log(`PATCH ${label}: BLOCKED (${error.code}) ${error.message}`);
      patchFailures += 1;
    } else if (error) {
      console.log(`PATCH ${label}: unexpected error: ${error.message}`);
    } else {
      console.log(`PATCH ${label}: ALLOWED (FAIL — should be blocked)`);
    }
  }

  const { data: after } = await supabase
    .from("profiles")
    .select(
      "subscription_status, free_evaluations_remaining, evaluations_used_this_period",
    )
    .eq("id", userId)
    .single();

  console.log("Profile after PATCH attempts:", after);

  if (patchFailures !== 3) {
    console.error(`Expected 3 blocked PATCHes, got ${patchFailures}`);
    process.exit(1);
  }

  console.log("PATCH lockdown: OK (all 3 billing fields blocked)");

  if (process.env.RUN_CONSUME_SMOKE === "1") {
    const freeBefore = after?.free_evaluations_remaining ?? 0;
    const usedBefore = after?.evaluations_used_this_period ?? 0;

    const { error: rpcError } = await supabase.rpc("consume_evaluation_credit", {
      p_user_id: userId,
    });

    if (rpcError) {
      console.error("consume_evaluation_credit failed:", rpcError.message);
      process.exit(1);
    }

    const { data: consumed } = await supabase
      .from("profiles")
      .select(
        "subscription_status, free_evaluations_remaining, evaluations_used_this_period, last_evaluation_at",
      )
      .eq("id", userId)
      .single();

    console.log("Profile after consume_evaluation_credit:", consumed);

    const freeAfter = consumed?.free_evaluations_remaining ?? 0;
    const usedAfter = consumed?.evaluations_used_this_period ?? 0;

    if (freeBefore > 0 && freeAfter !== freeBefore - 1) {
      console.error("Expected free_evaluations_remaining to decrement by 1");
      process.exit(1);
    }
    if (freeBefore === 0 && consumed?.subscription_status === "active" && usedAfter !== usedBefore + 1) {
      console.error("Expected evaluations_used_this_period to increment by 1");
      process.exit(1);
    }

    console.log("consume_evaluation_credit RPC: OK");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
