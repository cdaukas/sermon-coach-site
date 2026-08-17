import type Stripe from "stripe";
import type { MentorSeatSku } from "@/lib/billing/checkout";

export type CreateCheckoutSessionParams =
  | {
      type: "subscription";
      priceId: string;
      userId: string;
      customerId: string;
      successUrl: string;
      cancelUrl: string;
    }
  | {
      type: "pack";
      priceId: string;
      userId: string;
      customerId: string;
      successUrl: string;
      cancelUrl: string;
    }
  | {
      type: "mentor_seat";
      seatType: MentorSeatSku;
      priceId: string;
      quantity: number;
      userId: string;
      customerId: string;
      successUrl: string;
      cancelUrl: string;
    };

export async function createStripeCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutSessionParams,
): Promise<Stripe.Checkout.Session> {
  if (params.type === "subscription") {
    return stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer: params.customerId,
      client_reference_id: params.userId,
      // Mutually exclusive with `discounts` on the same session.
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: params.userId,
          checkout_type: "subscription",
        },
      },
      metadata: {
        supabase_user_id: params.userId,
        checkout_type: "subscription",
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  if (params.type === "pack") {
    return stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer: params.customerId,
      client_reference_id: params.userId,
      metadata: {
        supabase_user_id: params.userId,
        checkout_type: "pack",
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  if (params.type === "mentor_seat") {
    const quantity = Math.max(1, Math.min(20, Math.floor(params.quantity)));
    return stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity }],
      customer: params.customerId,
      client_reference_id: params.userId,
      subscription_data: {
        metadata: {
          supabase_user_id: params.userId,
          checkout_type: "mentor_seat",
          seat_type: params.seatType,
        },
      },
      metadata: {
        supabase_user_id: params.userId,
        checkout_type: "mentor_seat",
        seat_type: params.seatType,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  throw new Error(
    `Unsupported checkout type: ${(params as { type: string }).type}`,
  );
}
