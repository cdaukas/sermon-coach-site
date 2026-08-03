/**
 * Backfill profiles.subscription_interval and profiles.current_period_end
 * from live Stripe subscriptions (active + trialing).
 *
 * Uses extractSubscriptionBillingFields from the webhook handler so field
 * extraction cannot drift from activation writes.
 *
 * Safety:
 *   - Dry-run is the default (prints intended updates, writes nothing).
 *   - Explicit --apply is required to mutate rows.
 *   - Never writes subscription_status, credits, or any other column.
 *
 * Env (must be set; .env.local is loaded only if keys are not already set):
 *   STRIPE_SECRET_KEY            — use the **live** key for production subscribers
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Dry-run (default):
 *   STRIPE_SECRET_KEY=sk_live_… SUPABASE_SERVICE_ROLE_KEY=… NEXT_PUBLIC_SUPABASE_URL=… \
 *     npx tsx scripts/backfill-subscription-fields.ts
 *
 * or, after exporting live vars (do not rely on .env.local sk_test alone):
 *   npx tsx scripts/backfill-subscription-fields.ts
 *   npx tsx scripts/backfill-subscription-fields.ts --dry-run
 *
 * Apply:
 *   npx tsx scripts/backfill-subscription-fields.ts --apply
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { extractSubscriptionBillingFields } from "../src/lib/billing/stripe-webhook";

function loadEnvLocalIfPresent(): void {
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

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

function parseArgs(argv: string[]): { apply: boolean } {
  const tokens = argv.slice(2);
  let sawApply = false;
  let sawDryRun = false;
  for (const token of tokens) {
    if (token === "--apply") {
      sawApply = true;
      continue;
    }
    if (token === "--dry-run") {
      sawDryRun = true;
      continue;
    }
    console.error(`Unknown argument: ${token}`);
    console.error(
      "Usage: npx tsx scripts/backfill-subscription-fields.ts [--dry-run] [--apply]",
    );
    process.exit(1);
  }
  // Default dry-run. --dry-run wins over --apply if both are passed.
  if (sawDryRun) return { apply: false };
  if (sawApply) return { apply: true };
  return { apply: false };
}

function getSubscriptionCustomerId(
  subscription: Stripe.Subscription,
): string | null {
  const customer = subscription.customer;
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

async function listSubscriptionsByStatus(
  stripe: Stripe,
  status: "active" | "trialing",
): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.subscriptions.list({
      status,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    out.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]!.id;
  }

  return out;
}

async function main(): Promise<void> {
  loadEnvLocalIfPresent();

  const { apply } = parseArgs(process.argv);
  const mode = apply ? "APPLY" : "DRY-RUN";

  const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (stripeSecretKey.startsWith("sk_test")) {
    console.warn(
      "WARNING: STRIPE_SECRET_KEY is a test key (sk_test…). Existing production subscribers live under the live key; dry-run/apply against test will not see them.",
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Mode: ${mode}`);
  console.log("Listing Stripe subscriptions: active, then trialing…");

  const active = await listSubscriptionsByStatus(stripe, "active");
  const trialing = await listSubscriptionsByStatus(stripe, "trialing");
  const subscriptions = [...active, ...trialing];

  console.log(
    `Fetched ${active.length} active + ${trialing.length} trialing = ${subscriptions.length} total`,
  );

  let wouldUpdate = 0;
  let updated = 0;
  let skippedNoCustomer = 0;
  let skippedNoProfile = 0;
  let writeErrors = 0;

  for (const subscription of subscriptions) {
    const customerId = getSubscriptionCustomerId(subscription);
    if (!customerId) {
      skippedNoCustomer += 1;
      console.warn(
        "skip: subscription missing customer id",
        subscription.id,
        subscription.status,
      );
      continue;
    }

    const billing = extractSubscriptionBillingFields(subscription);

    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select(
        "id, stripe_customer_id, subscription_interval, current_period_end, subscription_status",
      )
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "profile lookup failed",
        customerId,
        lookupError.message,
      );
      writeErrors += 1;
      continue;
    }

    if (!profile) {
      skippedNoProfile += 1;
      console.warn(
        "no profile for Stripe customer",
        customerId,
        "subscription",
        subscription.id,
        "status",
        subscription.status,
      );
      continue;
    }

    const intended = {
      profileId: profile.id,
      customerId,
      subscriptionId: subscription.id,
      stripeStatus: subscription.status,
      from: {
        subscription_interval: profile.subscription_interval ?? null,
        current_period_end: profile.current_period_end ?? null,
      },
      to: {
        subscription_interval: billing.subscriptionInterval,
        current_period_end: billing.currentPeriodEnd,
      },
      // status shown for review only — never written
      profile_subscription_status: profile.subscription_status,
    };

    console.log(JSON.stringify(intended));

    wouldUpdate += 1;

    if (!apply) continue;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_interval: billing.subscriptionInterval,
        current_period_end: billing.currentPeriodEnd,
      })
      .eq("id", profile.id);

    if (updateError) {
      writeErrors += 1;
      console.error(
        "update failed",
        profile.id,
        customerId,
        updateError.message,
      );
      continue;
    }

    updated += 1;
  }

  console.log("--- summary ---");
  console.log({
    mode,
    subscriptions_seen: subscriptions.length,
    intended_updates: wouldUpdate,
    applied_updates: updated,
    skipped_no_customer: skippedNoCustomer,
    skipped_no_profile: skippedNoProfile,
    errors: writeErrors,
  });

  if (!apply) {
    console.log(
      "Dry-run complete. Re-run with --apply to write subscription_interval and current_period_end only.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
