import { createStripeCheckoutSession } from "@/lib/billing/create-checkout-session";
import {
  buildMentorSeatSignupPath,
  buildPackSignupPath,
  buildSignupPath,
  getCoachPriceId,
  getMentorSeatPriceId,
  getPackPriceId,
  parseCoachCheckoutParams,
  parseMentorSeatCheckoutParams,
  parsePackCheckoutParams,
} from "@/lib/billing/checkout";
import { getOrCreateStripeCustomer } from "@/lib/billing/stripe-customer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const coachParams = parseCoachCheckoutParams(requestUrl.searchParams);
  const packParams = parsePackCheckoutParams(requestUrl.searchParams);
  const seatParams = parseMentorSeatCheckoutParams(requestUrl.searchParams);

  if (!coachParams && !packParams && !seatParams) {
    return NextResponse.redirect(new URL("/pricing.html", requestUrl.origin));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signupPath = coachParams
      ? buildSignupPath(coachParams.cadence)
      : packParams
        ? buildPackSignupPath(packParams.pack)
        : buildMentorSeatSignupPath(seatParams!.seat, seatParams!.quantity);
    return NextResponse.redirect(new URL(signupPath, requestUrl.origin));
  }

  if (!user.email) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("Checkout: missing STRIPE_SECRET_KEY");
    return NextResponse.redirect(new URL("/pricing.html", requestUrl.origin));
  }

  const origin = requestUrl.origin;
  const stripe = new Stripe(stripeSecretKey);

  try {
    const adminSupabase = createAdminClient();
    const customerId = await getOrCreateStripeCustomer(stripe, adminSupabase, {
      userId: user.id,
      email: user.email,
    });

    const session = await createStripeCheckoutSession(
      stripe,
      coachParams
        ? {
            type: "subscription",
            priceId: getCoachPriceId(coachParams.cadence),
            userId: user.id,
            customerId,
            successUrl: `${origin}/dashboard`,
            cancelUrl: `${origin}/dashboard`,
          }
        : packParams
          ? {
              type: "pack",
              priceId: getPackPriceId(packParams.pack),
              userId: user.id,
              customerId,
              successUrl: `${origin}/dashboard`,
              cancelUrl: `${origin}/dashboard`,
            }
          : {
              type: "mentor_seat",
              seatType: seatParams!.seat,
              priceId: getMentorSeatPriceId(seatParams!.seat),
              quantity: seatParams!.quantity,
              userId: user.id,
              customerId,
              successUrl: `${origin}/dashboard/mentoring`,
              cancelUrl: `${origin}/dashboard/mentoring`,
            },
    );

    if (!session.url) {
      throw new Error("Stripe checkout session missing url");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown checkout error";
    console.error("Checkout: failed to create Stripe session", message, error);
    return NextResponse.redirect(new URL("/pricing.html", requestUrl.origin));
  }
}
