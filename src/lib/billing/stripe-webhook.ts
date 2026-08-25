import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revokeExcessPendingForMentor } from "@/lib/billing/mentor-seat-revoke-pending";

const ACTIVATION_STATUSES = new Set(["active", "trialing"]);
const GRACE_STATUSES = new Set(["past_due"]);

export type StripeWebhookDeps = {
  supabase: SupabaseClient;
  stripe: Stripe;
  logError: (message: string, meta?: Record<string, unknown>) => void;
};

export type SubscriptionBillingFields = {
  subscriptionInterval: string | null;
  currentPeriodEnd: string | null;
  startDate: string | null;
};

export type CancellationSource = "voluntary" | "payment_failure" | "admin";

export function isActivatingSubscriptionStatus(status: string): boolean {
  return ACTIVATION_STATUSES.has(status);
}

export function isGraceSubscriptionStatus(status: string): boolean {
  return GRACE_STATUSES.has(status);
}

function getCustomerId(subscription: Stripe.Subscription): string | null {
  const customer = subscription.customer;
  if (typeof customer === "string") {
    return customer;
  }
  return customer?.id ?? null;
}

/**
 * Read interval + period end from a Stripe Subscription.
 * Prefer item-level current_period_end (Stripe API recent shape); fall back to
 * top-level when present. Missing values become null — never throws.
 */
export function extractSubscriptionBillingFields(
  subscription: Stripe.Subscription,
): SubscriptionBillingFields {
  const firstItem = subscription.items?.data?.[0];

  let subscriptionInterval: string | null = null;
  const price = firstItem?.price;
  if (
    price &&
    typeof price === "object" &&
    price.recurring &&
    typeof price.recurring.interval === "string" &&
    price.recurring.interval.length > 0
  ) {
    subscriptionInterval = price.recurring.interval;
  }

  let periodEndUnix: number | null = null;
  if (firstItem && typeof firstItem.current_period_end === "number") {
    periodEndUnix = firstItem.current_period_end;
  } else {
    const topLevel = (subscription as { current_period_end?: unknown })
      .current_period_end;
    if (typeof topLevel === "number") {
      periodEndUnix = topLevel;
    }
  }

  return {
    subscriptionInterval,
    currentPeriodEnd:
      periodEndUnix != null
        ? new Date(periodEndUnix * 1000).toISOString()
        : null,
    startDate:
      typeof subscription.start_date === "number"
        ? new Date(subscription.start_date * 1000).toISOString()
        : null,
  };
}

export function cancellationSourceFromStripe(
  subscription: Stripe.Subscription,
): CancellationSource | null {
  if (subscription.status === "unpaid") {
    return "payment_failure";
  }

  const reason = subscription.cancellation_details?.reason;
  if (reason === "payment_failed") {
    return "payment_failure";
  }
  if (reason === "cancellation_requested") {
    return "voluntary";
  }

  return null;
}

function cancellationStampFromSubscription(subscription: Stripe.Subscription): {
  canceled_at: string | null;
  cancellation_effective_at: string | null;
  cancellation_reason: string | null;
  cancellation_comment: string | null;
} {
  const billing = extractSubscriptionBillingFields(subscription);
  return {
    canceled_at:
      typeof subscription.canceled_at === "number"
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    cancellation_effective_at: billing.currentPeriodEnd,
    cancellation_reason: subscription.cancellation_details?.reason ?? null,
    cancellation_comment: subscription.cancellation_details?.comment ?? null,
  };
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
  billing: SubscriptionBillingFields,
  pendingCancellation?: { subscription: Stripe.Subscription },
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("subscription_started_at")
    .eq("id", profileId)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `Failed to read profile ${profileId} before activate: ${readError.message}`,
    );
  }

  const values: Record<string, unknown> = {
    stripe_customer_id: customerId,
    subscription_status: "active",
    subscription_interval: billing.subscriptionInterval,
    current_period_end: billing.currentPeriodEnd,
  };

  if (pendingCancellation && pendingCancellation.subscription) {
    const source =
      cancellationSourceFromStripe(pendingCancellation.subscription) ??
      "voluntary";
    Object.assign(values, {
      cancellation_source: source,
      ...cancellationStampFromSubscription(pendingCancellation.subscription),
    });
  } else {
    values.canceled_at = null;
    values.cancellation_effective_at = null;
    values.cancellation_source = null;
    values.cancellation_reason = null;
    values.cancellation_comment = null;
  }

  if (existing?.subscription_started_at == null && billing.startDate) {
    values.subscription_started_at = billing.startDate;
  }

  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to activate profile ${profileId}: ${error.message}`);
  }
}

async function deactivateProfile(
  supabase: SupabaseClient,
  profileId: string,
  source: CancellationSource | null,
  subscription: Stripe.Subscription,
): Promise<void> {
  // Intentionally does not null subscription_interval or current_period_end.
  const values: Record<string, unknown> = {
    subscription_status: "inactive",
  };

  const isEndedStatus =
    subscription.status === "canceled" || subscription.status === "unpaid";
  if (source != null || isEndedStatus) {
    Object.assign(values, {
      cancellation_source: source,
      ...cancellationStampFromSubscription(subscription),
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", profileId);

  if (error) {
    throw new Error(
      `Failed to deactivate profile ${profileId}: ${error.message}`,
    );
  }
}

/** Stripe metadata seat_type for mentor-seat subscriptions. */
export type MentorSeatStripeType = "debrief" | "evaluation";

/**
 * Mentoring seat products never touch Coach subscription_status.
 * Identified only by checkout_type=mentor_seat + seat_type on the Subscription
 * (or Checkout Session) metadata written at session create.
 */
export function getMentorSeatTypeFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): MentorSeatStripeType | null {
  if (!metadata || metadata.checkout_type !== "mentor_seat") {
    return null;
  }
  const seatType = metadata.seat_type;
  if (seatType === "debrief" || seatType === "evaluation") {
    return seatType;
  }
  return null;
}

function subscriptionItemQuantity(
  subscription: Stripe.Subscription,
): number {
  const raw = subscription.items?.data?.[0]?.quantity;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  return 1;
}

/**
 * Write purchased seat counters and always re-sync pending invites to capacity.
 * Every quantity/cancel path must go through here so revoke cannot be skipped
 * (including customer.subscription.deleted → forceZero).
 */
async function setPurchasedMentorSeats(
  supabase: SupabaseClient,
  profileId: string,
  seatType: MentorSeatStripeType,
  quantity: number,
): Promise<void> {
  const column =
    seatType === "debrief"
      ? "purchased_debrief_seats"
      : "purchased_evaluation_seats";

  const safeQty = Math.max(0, Math.floor(quantity));
  const { error } = await supabase
    .from("profiles")
    .update({ [column]: safeQty })
    .eq("id", profileId);

  if (error) {
    throw new Error(
      `Failed to set ${column} for profile ${profileId}: ${error.message}`,
    );
  }

  // Capacity drop can come from qty write, cancel, payment failure, etc.
  // Recompute both seat types; pass known purchased so we do not re-read a
  // stale counter for the type we just wrote.
  await revokeExcessPendingForMentor(supabase, profileId, {
    written: { seatType, purchasedSeats: safeQty },
  });
}

/**
 * Provision or clear purchased seat capacity for a mentor-seat subscription.
 * Recomputes quantity as the sum of item quantities across all active/trialing
 * mentor-seat subscriptions of that type for the customer (safe if they open
 * more than one Checkout Session). Does not touch Coach status or
 * comp_debrief_seats. Excess pending of this seat type are revoked when
 * capacity no longer covers them; active relationships stay put.
 */
export async function applyMentorSeatSubscriptionState(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDeps,
  options?: { forceZero?: boolean },
): Promise<{ matched: boolean; seatType: MentorSeatStripeType | null }> {
  const seatType = getMentorSeatTypeFromMetadata(subscription.metadata);
  if (!seatType) {
    return { matched: false, seatType: null };
  }

  const customerId = getCustomerId(subscription);
  if (!customerId) {
    deps.logError("Mentor seat subscription missing customer ID", {
      subscriptionId: subscription.id,
    });
    return { matched: false, seatType };
  }

  const match = await resolveProfileForSubscriptionCustomer(deps, {
    customerId,
    metadataUserId: subscription.metadata?.supabase_user_id,
    subscriptionId: subscription.id,
    resolveEmail: () => resolveCustomerEmail(deps.stripe, subscription),
  });

  if (!match.matched) {
    deps.logError("Mentor seat subscription: no profile match", {
      customerId,
      subscriptionId: subscription.id,
      reason: match.reason,
      seatType,
    });
    return { matched: false, seatType };
  }

  const quantity = options?.forceZero
    ? await sumActiveMentorSeatQuantity(deps.stripe, customerId, seatType, {
        excludeSubscriptionId: subscription.id,
      })
    : await sumActiveMentorSeatQuantity(deps.stripe, customerId, seatType);

  // Writes purchased_* and revokes excess pending for this mentor (both types).
  await setPurchasedMentorSeats(
    deps.supabase,
    match.profileId,
    seatType,
    quantity,
  );

  // Optionally store stripe_customer_id without activating Coach.
  if (customerId) {
    const { error } = await deps.supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", match.profileId);
    if (error) {
      throw new Error(
        `Failed to store stripe_customer_id for mentor seat profile ${match.profileId}: ${error.message}`,
      );
    }
  }

  return { matched: true, seatType };
}

async function sumActiveMentorSeatQuantity(
  stripe: Stripe,
  customerId: string,
  seatType: MentorSeatStripeType,
  options?: { excludeSubscriptionId?: string },
): Promise<number> {
  let total = 0;
  let startingAfter: string | undefined;

  // Paginate lightly; seat buyers are not expected to have large catalogs.
  for (let page = 0; page < 5; page += 1) {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of list.data) {
      if (
        options?.excludeSubscriptionId &&
        sub.id === options.excludeSubscriptionId
      ) {
        continue;
      }
      if (getMentorSeatTypeFromMetadata(sub.metadata) !== seatType) {
        continue;
      }
      if (!isActivatingSubscriptionStatus(sub.status)) {
        continue;
      }
      total += subscriptionItemQuantity(sub);
    }

    if (!list.has_more || list.data.length === 0) {
      break;
    }
    startingAfter = list.data[list.data.length - 1]?.id;
    if (!startingAfter) {
      break;
    }
  }

  return total;
}

type ProfileMatch =
  | { matched: true; profileId: string }
  | { matched: false; reason: string };

/**
 * Shared profile match order for subscription lifecycle writes:
 * metadata.supabase_user_id → stripe_customer_id → legacy email.
 */
async function resolveProfileForSubscriptionCustomer(
  deps: StripeWebhookDeps,
  params: {
    customerId: string;
    metadataUserId?: string | null;
    subscriptionId?: string | null;
    /** Prefer expanded customer email when the event already carries it. */
    resolveEmail?: () => Promise<string | null>;
  },
): Promise<ProfileMatch> {
  const { customerId, metadataUserId, subscriptionId } = params;

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
      return { matched: true, profileId: profileByMetadata.id };
    }

    deps.logError(
      "Stripe subscription: supabase_user_id metadata did not match a profile",
      {
        metadataUserId,
        customerId,
        subscriptionId: subscriptionId ?? undefined,
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
    return { matched: true, profileId: byCustomerId.id };
  }

  const email = params.resolveEmail
    ? await params.resolveEmail()
    : await (async () => {
        const retrieved = await deps.stripe.customers.retrieve(customerId);
        if (retrieved.deleted) return null;
        return retrieved.email ?? null;
      })();

  if (!email) {
    return {
      matched: false,
      reason: "could not resolve customer email for profile match",
    };
  }

  deps.logError(
    "Subscription: using legacy email match fallback (retire when unused)",
    {
      email,
      customerId,
      subscriptionId: subscriptionId ?? undefined,
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
    return {
      matched: false,
      reason: "no Supabase profile matched metadata, customer id, or email",
    };
  }

  return { matched: true, profileId };
}

function getSessionCustomerId(session: Stripe.Checkout.Session): string | null {
  const customer = session.customer;
  if (typeof customer === "string") {
    return customer;
  }
  return customer?.id ?? null;
}

function getInvoiceCustomerId(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer;
  if (typeof customer === "string") {
    return customer;
  }
  return customer?.id ?? null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Stripe API 2025+ nests subscription under parent.subscription_details.
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) {
    return null;
  }
  if (typeof subscription === "string") {
    return subscription;
  }
  return subscription.id ?? null;
}

/**
 * Activates from Checkout Session via client_reference_id.
 *
 * Events handled with this helper (and lifecycle siblings):
 * - checkout.session.completed (subscription mode)
 * - customer.subscription.created / .updated
 * - customer.subscription.deleted
 * - invoice.payment_failed (Coach only; seats wait for subscription.updated)
 *
 * Mentor-seat sessions (metadata.checkout_type=mentor_seat) provision
 * purchased_*_seats only — never set subscription_status.
 */
export async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
): Promise<void> {
  if (session.mode !== "subscription") {
    return;
  }

  // Mentoring seats: provision quantity; do not activate Coach.
  if (getMentorSeatTypeFromMetadata(session.metadata)) {
    await handleMentorSeatCheckoutCompleted(session, deps);
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

  // Session carries subscription id (string), not item interval / period end.
  // One retrieve per new subscriber — preferred over expand (keeps webhook payload shape stable).
  const billing = await loadBillingFieldsForCheckoutSession(session, deps);

  await activateProfile(deps.supabase, profile.id, customerId, billing);
}

async function handleMentorSeatCheckoutCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
): Promise<void> {
  const seatType = getMentorSeatTypeFromMetadata(session.metadata);
  if (!seatType) {
    return;
  }

  const profileId = session.client_reference_id;
  if (!profileId) {
    deps.logError("Mentor seat checkout: missing client_reference_id", {
      sessionId: session.id,
      seatType,
    });
    return;
  }

  const customerId = getSessionCustomerId(session);
  if (!customerId) {
    deps.logError("Mentor seat checkout: missing customer id", {
      sessionId: session.id,
      profileId,
      seatType,
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
      `Mentor seat profile lookup failed: ${profileError.message}`,
    );
  }

  if (!profile) {
    deps.logError("Mentor seat checkout: no profile for client_reference_id", {
      sessionId: session.id,
      profileId,
      customerId,
      seatType,
    });
    return;
  }

  let quantity = 1;
  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string"
      ? subscriptionRef
      : subscriptionRef && typeof subscriptionRef === "object"
        ? subscriptionRef.id
        : null;

  if (subscriptionId) {
    try {
      const subscription =
        await deps.stripe.subscriptions.retrieve(subscriptionId);
      // Prefer full recompute so concurrent seat subs stack.
      quantity = await sumActiveMentorSeatQuantity(
        deps.stripe,
        customerId,
        seatType,
      );
      if (quantity === 0 && isActivatingSubscriptionStatus(subscription.status)) {
        quantity = subscriptionItemQuantity(subscription);
      }
    } catch (err) {
      deps.logError(
        "Mentor seat checkout: failed to retrieve subscription; defaulting quantity 1",
        {
          sessionId: session.id,
          subscriptionId,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }
  }

  await setPurchasedMentorSeats(
    deps.supabase,
    profile.id,
    seatType,
    quantity,
  );

  const { error: customerError } = await deps.supabase
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", profile.id);

  if (customerError) {
    throw new Error(
      `Mentor seat checkout: failed to store stripe_customer_id: ${customerError.message}`,
    );
  }
}

async function loadBillingFieldsForCheckoutSession(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDeps,
): Promise<SubscriptionBillingFields> {
  const empty: SubscriptionBillingFields = {
    subscriptionInterval: null,
    currentPeriodEnd: null,
    startDate: null,
  };

  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string"
      ? subscriptionRef
      : subscriptionRef && typeof subscriptionRef === "object"
        ? subscriptionRef.id
        : null;

  if (!subscriptionId) {
    deps.logError(
      "Subscription checkout: missing subscription id; activating without interval/period end",
      { sessionId: session.id },
    );
    return empty;
  }

  try {
    const subscription =
      await deps.stripe.subscriptions.retrieve(subscriptionId);
    return extractSubscriptionBillingFields(subscription);
  } catch (err) {
    deps.logError(
      "Subscription checkout: failed to retrieve subscription for billing fields; activating with nulls",
      {
        sessionId: session.id,
        subscriptionId,
        error: err instanceof Error ? err.message : String(err),
      },
    );
    return empty;
  }
}

/**
 * Maps Stripe subscription status at the boundary:
 * - Mentor seats: purchased_*_seats to quantity or 0
 * - Coach: active/trialing → activateProfile; else deactivateProfile
 */
export async function handleSubscriptionActivationEvent(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDeps,
): Promise<{ matched: boolean }> {
  if (getMentorSeatTypeFromMetadata(subscription.metadata)) {
    const result = await applyMentorSeatSubscriptionState(subscription, deps);
    return { matched: result.matched };
  }

  const customerId = getCustomerId(subscription);
  if (!customerId) {
    deps.logError("Stripe subscription missing customer ID", {
      subscriptionId: subscription.id,
    });
    return { matched: false };
  }

  const match = await resolveProfileForSubscriptionCustomer(deps, {
    customerId,
    metadataUserId: subscription.metadata?.supabase_user_id,
    subscriptionId: subscription.id,
    resolveEmail: () => resolveCustomerEmail(deps.stripe, subscription),
  });

  if (!match.matched) {
    deps.logError("No Supabase profile match for Stripe subscription", {
      customerId,
      subscriptionId: subscription.id,
      reason: match.reason,
      stripeStatus: subscription.status,
    });
    return { matched: false };
  }

  if (isActivatingSubscriptionStatus(subscription.status)) {
    await activateProfile(
      deps.supabase,
      match.profileId,
      customerId,
      extractSubscriptionBillingFields(subscription),
      subscription.cancel_at_period_end ? { subscription } : undefined,
    );
  } else if (isGraceSubscriptionStatus(subscription.status)) {
    // Stripe is still retrying. Write nothing: not activate, not deactivate.
    console.log("[stripe-webhook] grace status, no profile write", {
      profileId: match.profileId,
      status: subscription.status,
    });
  } else {
    const source = cancellationSourceFromStripe(subscription);
    if (
      (subscription.status === "canceled" ||
        subscription.status === "unpaid") &&
      source == null
    ) {
      deps.logError(
        "cancellation source ambiguous; writing inactive without guessing source",
        {
          profileId: match.profileId,
          subscriptionId: subscription.id,
          stripeStatus: subscription.status,
          cancellationReason: subscription.cancellation_details?.reason ?? null,
        },
      );
    }
    await deactivateProfile(
      deps.supabase,
      match.profileId,
      source,
      subscription,
    );
  }

  return { matched: true };
}

/** customer.subscription.deleted → Coach inactive, or seat capacity 0 + pending revoke. */
export async function handleSubscriptionDeletedEvent(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDeps,
): Promise<{ matched: boolean }> {
  if (getMentorSeatTypeFromMetadata(subscription.metadata)) {
    // Goes through setPurchasedMentorSeats → revokeExcessPendingForMentor.
    const result = await applyMentorSeatSubscriptionState(subscription, deps, {
      forceZero: true,
    });
    return { matched: result.matched };
  }

  const customerId = getCustomerId(subscription);
  if (!customerId) {
    deps.logError("Stripe subscription.deleted missing customer ID", {
      subscriptionId: subscription.id,
    });
    return { matched: false };
  }

  const match = await resolveProfileForSubscriptionCustomer(deps, {
    customerId,
    metadataUserId: subscription.metadata?.supabase_user_id,
    subscriptionId: subscription.id,
    resolveEmail: () => resolveCustomerEmail(deps.stripe, subscription),
  });

  if (!match.matched) {
    deps.logError("subscription.deleted: no profile match", {
      customerId,
      subscriptionId: subscription.id,
      reason: match.reason,
    });
    return { matched: false };
  }

  const source = cancellationSourceFromStripe(subscription);
  if (source == null) {
    deps.logError(
      "subscription.deleted: cancellation source ambiguous; writing inactive without guessing source",
      {
        profileId: match.profileId,
        subscriptionId: subscription.id,
        cancellationReason: subscription.cancellation_details?.reason ?? null,
      },
    );
  }
  await deactivateProfile(deps.supabase, match.profileId, source, subscription);
  return { matched: true };
}

/**
 * invoice.payment_failed → inactive when a profile can be resolved with the
 * same match order. Skips (and logs why) when it cannot — subscription.updated
 * will still catch the state change.
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  deps: StripeWebhookDeps,
): Promise<{ matched: boolean; skipped?: string }> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    const skipped =
      "invoice.payment_failed has no subscription id (not a subscription invoice); skipping — subscription.updated will catch state changes";
    deps.logError(skipped, { invoiceId: invoice.id });
    return { matched: false, skipped };
  }

  const customerId = getInvoiceCustomerId(invoice);
  if (!customerId) {
    const skipped =
      "invoice.payment_failed missing customer id; skipping — subscription.updated will catch state changes";
    deps.logError(skipped, {
      invoiceId: invoice.id,
      subscriptionId,
    });
    return { matched: false, skipped };
  }

  let metadataUserId: string | null = null;
  let retrievedSubscription: Stripe.Subscription | null = null;
  try {
    retrievedSubscription =
      await deps.stripe.subscriptions.retrieve(subscriptionId);
    metadataUserId = retrievedSubscription.metadata?.supabase_user_id ?? null;
  } catch (err) {
    deps.logError(
      "invoice.payment_failed: could not retrieve subscription for metadata match; continuing with customer id / email",
      {
        invoiceId: invoice.id,
        subscriptionId,
        error: err instanceof Error ? err.message : String(err),
      },
    );
  }

  // Seat products: do not deactivate Coach. subscription.updated clears capacity.
  if (
    retrievedSubscription &&
    getMentorSeatTypeFromMetadata(retrievedSubscription.metadata)
  ) {
    const result = await applyMentorSeatSubscriptionState(
      retrievedSubscription,
      deps,
    );
    return { matched: result.matched };
  }

  const match = await resolveProfileForSubscriptionCustomer(deps, {
    customerId,
    metadataUserId,
    subscriptionId,
  });

  if (!match.matched) {
    const skipped = `invoice.payment_failed: ${match.reason}; skipping — subscription.updated will catch state changes`;
    deps.logError(skipped, {
      invoiceId: invoice.id,
      customerId,
      subscriptionId,
    });
    return { matched: false, skipped };
  }

  console.log("[stripe-webhook] payment failed, access retained during retries", {
    profileId: match.profileId,
  });
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
