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

function getSessionCustomerId(session: Stripe.Checkout.Session): string | null {
  const customer = session.customer;
  if (typeof customer === "string") {
    return customer;
  }
  return customer?.id ?? null;
}

/** Activates subscription from Checkout Session via client_reference_id (Supabase user id). */
export async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
): Promise<void> {
  if (session.mode !== "subscription") {
    return;
  }

  const profileId = session.client_reference_id;
  if (!profileId) {
    deps.logError("Subscription checkout: missing client_reference_id", {
      sessionId: session.id,
    });
    return;
  }

  const customerId = getSessionCustomerId(session);
  if (!customerId) {
    deps.logError("Subscription checkout: missing customer id", {
      sessionId: session.id,
      profileId,
    });
    return;
  }

  const { data: profile, error: profileError } = await deps.supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Profile lookup by client_reference_id failed: ${profileError.message}`,
    );
  }

  if (!profile) {
    deps.logError("Subscription checkout: no profile for client_reference_id", {
      sessionId: session.id,
      profileId,
      customerId,
    });
    return;
  }

  await activateProfile(deps.supabase, profile.id, customerId);
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

  const metadataUserId = subscription.metadata?.supabase_user_id;
  if (metadataUserId) {
    const { data: profileByMetadata, error: metadataLookupError } =
      await deps.supabase
        .from("profiles")
        .select("id")
        .eq("id", metadataUserId)
        .maybeSingle();

    if (metadataLookupError) {
      throw new Error(
        `Profile lookup by subscription metadata failed: ${metadataLookupError.message}`,
      );
    }

    if (profileByMetadata) {
      await activateProfile(deps.supabase, profileByMetadata.id, customerId);
      return { matched: true };
    }

    deps.logError(
      "Stripe subscription: supabase_user_id metadata did not match a profile",
      {
        metadataUserId,
        customerId,
        subscriptionId: subscription.id,
      },
    );
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

  deps.logError(
    "Subscription: using legacy email match fallback (retire when unused)",
    {
      email,
      customerId,
      subscriptionId: subscription.id,
    },
  );

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

function getCheckoutStripePaymentId(session: Stripe.Checkout.Session): string {
  const paymentIntent = session.payment_intent;
  if (typeof paymentIntent === "string") {
    return paymentIntent;
  }
  if (paymentIntent && typeof paymentIntent === "object") {
    return paymentIntent.id;
  }
  return session.id;
}

function getPackProductFromLineItems(
  lineItems: Stripe.ApiList<Stripe.LineItem>,
): Stripe.Product | null {
  const price = lineItems.data[0]?.price;
  const product = price?.product;
  if (!product || typeof product !== "object") {
    return null;
  }
  if ("deleted" in product && product.deleted) {
    return null;
  }
  return product;
}

export type WritePackGrantResult =
  | { outcome: "inserted"; row: Record<string, unknown> }
  | { outcome: "skipped_idempotent"; stripePaymentId: string }
  | { outcome: "no_profile"; email: string; stripePaymentId: string };

/** Profile lookup + idempotent insert into eval_credit_grants. */
export async function writePackGrant(
  supabase: SupabaseClient,
  params: {
    email: string;
    packSource: string;
    packQuantity: number;
    stripePaymentId: string;
  },
): Promise<WritePackGrantResult> {
  const { email, packSource, packQuantity, stripePaymentId } = params;

  const { data: profileId, error: emailLookupError } = await supabase.rpc(
    "find_profile_id_by_email",
    { p_email: email },
  );

  if (emailLookupError) {
    throw new Error(`Profile lookup by email failed: ${emailLookupError.message}`);
  }

  if (!profileId) {
    return { outcome: "no_profile", email, stripePaymentId };
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 18);

  const { data: row, error: insertError } = await supabase
    .from("eval_credit_grants")
    .insert({
      user_id: profileId,
      source: packSource,
      quantity_total: packQuantity,
      quantity_remaining: packQuantity,
      expires_at: expiresAt.toISOString(),
      stripe_payment_id: stripePaymentId,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      console.log("grant already exists, skipping", { stripePaymentId });
      return { outcome: "skipped_idempotent", stripePaymentId };
    }
    throw new Error(
      `Failed to insert eval_credit_grant: ${insertError.message}`,
    );
  }

  return { outcome: "inserted", row };
}

export async function handlePackCheckoutCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
): Promise<void> {
  const lineItems = await deps.stripe.checkout.sessions.listLineItems(
    session.id,
    { expand: ["data.price.product"] },
  );

  const product = getPackProductFromLineItems(lineItems);
  const packSource = product?.metadata?.pack_source;
  const packQuantityRaw = product?.metadata?.pack_quantity;

  if (!packSource || !packQuantityRaw) {
    return;
  }

  const packQuantity = Number.parseInt(packQuantityRaw, 10);
  if (!Number.isFinite(packQuantity) || packQuantity <= 0) {
    deps.logError("Pack checkout: invalid pack_quantity metadata", {
      sessionId: session.id,
      packQuantityRaw,
    });
    return;
  }

  const stripePaymentId = getCheckoutStripePaymentId(session);
  const email = session.customer_details?.email;

  if (!email) {
    deps.logError("Pack checkout: missing customer email", {
      sessionId: session.id,
      stripePaymentId,
    });
    return;
  }

  const result = await writePackGrant(deps.supabase, {
    email,
    packSource,
    packQuantity,
    stripePaymentId,
  });

  if (result.outcome === "no_profile") {
    deps.logError(
      "Pack checkout: payment succeeded but no Supabase profile matched the email; manual grant required",
      { email: result.email, stripePaymentId: result.stripePaymentId },
    );
  }
}
