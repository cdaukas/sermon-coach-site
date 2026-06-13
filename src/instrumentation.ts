export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const defined = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
    const prefix = process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 12) ?? "(unset)";
    console.log(
      `[startup] STRIPE_WEBHOOK_SECRET defined: ${defined} (prefix: ${prefix}…)`,
    );
  }
}
