import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GetOrCreateStripeCustomerParams = {
  userId: string;
  email: string;
};

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseClient,
  params: GetOrCreateStripeCustomerParams,
): Promise<string> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Profile lookup for Stripe customer failed: ${profileError.message}`,
    );
  }

  if (profile?.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (existing.deleted) {
      throw new Error(
        `Stripe customer ${profile.stripe_customer_id} is deleted for user ${params.userId}`,
      );
    }

    if (existing.email !== params.email) {
      await stripe.customers.update(existing.id, { email: params.email });
    }

    return existing.id;
  }

  const customer = await stripe.customers.create({
    email: params.email,
    metadata: {
      supabase_user_id: params.userId,
    },
  });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", params.userId);

  if (updateError) {
    throw new Error(
      `Failed to store stripe_customer_id for user ${params.userId}: ${updateError.message}`,
    );
  }

  return customer.id;
}
