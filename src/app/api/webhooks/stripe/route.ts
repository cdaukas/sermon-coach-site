import { NextResponse } from "next/server";
import Stripe from "stripe";
import { handleSubscriptionActivationEvent } from "@/lib/billing/stripe-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

// Redeploy trigger — pick up corrected STRIPE_SECRET_KEY.
export const runtime = "nodejs";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
]);

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecretKey) {
    console.error(
      "Stripe webhook: missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY",
    );
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification requires the raw request bytes — not parsed JSON.
  const rawBody = await request.text();

  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!SUBSCRIPTION_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    const supabase = createAdminClient();
    await handleSubscriptionActivationEvent(
      event.data.object as Stripe.Subscription,
      {
        supabase,
        stripe,
        logError: (message, meta) => console.error(message, meta ?? {}),
      },
    );
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
