import type Stripe from "stripe";

export type CheckoutSessionType = "subscription" | "pack";

export type CreateCheckoutSessionParams = {
  type: CheckoutSessionType;
  priceId: string;
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

  throw new Error(`Unsupported checkout type: ${params.type}`);
}
