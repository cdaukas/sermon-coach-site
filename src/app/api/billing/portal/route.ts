// POST /api/billing/portal
// Creates a Stripe Billing Portal session for the signed-in user.
// stripe_customer_id is always read from the user's profile — never from the request.

import { createClient } from "@/lib/supabase/server";
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
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/buy`,
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
