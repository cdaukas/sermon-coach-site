import { MENTOR_SEAT_PRICE_ENV_VARS } from "@/lib/billing/checkout";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const defined = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
    const prefix = process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 12) ?? "(unset)";
    console.log(
      `[startup] STRIPE_WEBHOOK_SECRET defined: ${defined} (prefix: ${prefix}…)`,
    );

    // Presence only, never the value. Seat prices have no fallback, so a
    // missing one should be visible at boot rather than at a click.
    for (const envVar of Object.values(MENTOR_SEAT_PRICE_ENV_VARS)) {
      console.log(
        `[startup] ${envVar} defined: ${Boolean(process.env[envVar])}`,
      );
    }
  }
}
