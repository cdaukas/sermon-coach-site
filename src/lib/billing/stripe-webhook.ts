import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVATION_STATUSES = new Set(["active", "trialing"]);

export type StripeWebhookDeps = {
  supabase: SupabaseClient;
  stripe: Stripe;
  logError: (message: string, meta?: Record<string, unknown>) => void;
};

export function isActivatingSubscriptionStatus(status: string): boolean {
  return ACTIVATION_STATUSES.has(status);
}

function getCustomerId(subscription: Stripe.Subscription): string | null {
  const customer = subscription.customer;
  if (typeof customer === "string") {
    return customer;
  }
  return customer?.id ?? null;
}

export async function resolveCustomerEmail(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const customer = subscription.customer;
  if (typeof customer === "object" && customer !== null && !customer.deleted) {
    return customer.email ?? null;
  }

  const customerId = getCustomerId(subscription);
  if (!customerId) {
    return null;
  }

  const retrieved = await stripe.customers.retrieve(customerId);
  if (retrieved.deleted) {
    return null;
  }
  return retrieved.email ?? null;
}

async function activateProfile(
  supabase: SupabaseClient,
  profileId: string,
  customerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      subscription_status: "active",
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to activate profile ${profileId}: ${error.message}`);
  }
}

export async function handleSubscriptionActivationEvent(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDeps,
): Promise<{ matched: boolean }> {
  if (!isActivatingSubscriptionStatus(subscription.status)) {
    return { matched: true };
  }

  const customerId = getCustomerId(subscription);
  if (!customerId) {
    deps.logError("Stripe subscription missing customer ID", {
      subscriptionId: subscription.id,
    });
    return { matched: false };
  }

  const { data: byCustomerId, error: customerLookupError } = await deps.supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(
      `Profile lookup by stripe_customer_id failed: ${customerLookupError.message}`,
    );
  }

  if (byCustomerId) {
    await activateProfile(deps.supabase, byCustomerId.id, customerId);
    return { matched: true };
  }

  const email = await resolveCustomerEmail(deps.stripe, subscription);
  if (!email) {
    deps.logError("Stripe subscription: could not resolve customer email", {
      customerId,
      subscriptionId: subscription.id,
    });
    return { matched: false };
  }

  const { data: profileId, error: emailLookupError } = await deps.supabase.rpc(
    "find_profile_id_by_email",
    { p_email: email },
  );

  if (emailLookupError) {
    throw new Error(`Profile lookup by email failed: ${emailLookupError.message}`);
  }

  if (!profileId) {
    deps.logError("No Supabase profile match for Stripe subscription", {
      email,
      customerId,
      subscriptionId: subscription.id,
    });
    return { matched: false };
  }

  await activateProfile(deps.supabase, profileId, customerId);
  return { matched: true };
}
