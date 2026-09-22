// POST /api/billing/portal
// Creates a Stripe Billing Portal session for the signed-in user.
// stripe_customer_id is always read from the user's profile — never from the request.
//
// An optional { intent: "switch_to_annual" } body deep-links a Coach monthly
// subscriber to a "confirm Coach annual" screen instead of the portal front
// page. The subscription, item and target price are all derived server-side
// from that customer id; the request never supplies them. Any guard that does
// not hold falls back to a plain session, which is the behaviour that shipped
// before the deep link and is always safe.

import { createClient } from "@/lib/supabase/server";
import {
  buildAnnualSwitchFlow,
  createPortalSession,
  parsePortalIntent,
  PORTAL_INTENT_SWITCH_TO_ANNUAL,
} from "@/lib/billing/portal-flow";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function isMissingPortalConfiguration(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("no configuration provided") ||
    lower.includes("default configuration") ||
    lower.includes("customer portal settings")
  );
}

export async function POST(request: Request) {
  const intent = parsePortalIntent(
    await request.json().catch(() => null),
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("Billing portal: missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Billing portal: profile lookup failed", profileError);
    return NextResponse.json(
      { error: "Could not load account." },
      { status: 500 },
    );
  }

  const customerId =
    typeof profile?.stripe_customer_id === "string"
      ? profile.stripe_customer_id.trim()
      : "";

  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No billing account is linked yet. Complete a purchase or start a subscription first.",
      },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const stripe = new Stripe(stripeSecretKey);

  try {
    let flowData:
      | Stripe.BillingPortal.SessionCreateParams.FlowData
      | undefined;

    if (intent === PORTAL_INTENT_SWITCH_TO_ANNUAL) {
      const result = await buildAnnualSwitchFlow(stripe, customerId);
      if ("flowData" in result) {
        flowData = result.flowData;
      } else {
        console.info(
          "Billing portal: switch_to_annual fell back to a plain session",
          { reason: result.fallback },
        );
      }
    }

    const session = await createPortalSession(stripe, {
      customerId,
      returnUrl: `${origin}/dashboard/buy`,
      flowData,
    });

    if (!session.url) {
      console.error("Billing portal: session missing url");
      return NextResponse.json(
        { error: "Could not open the billing portal." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (isMissingPortalConfiguration(error.message)) {
        console.error(
          "Billing portal: Stripe account has no portal configuration",
          error.message,
        );
        return NextResponse.json(
          {
            error:
              "Subscription management is not available yet. Please try again later.",
          },
          { status: 503 },
        );
      }

      console.error("Billing portal: Stripe error", error.type, error.message);
      return NextResponse.json(
        { error: "Could not open the billing portal." },
        { status: 502 },
      );
    }

    console.error("Billing portal: unexpected failure", error);
    return NextResponse.json(
      { error: "Could not open the billing portal." },
      { status: 500 },
    );
  }
}
