import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractSubscriptionBillingFields,
  getMentorSeatTypeFromMetadata,
  handleInvoicePaymentFailed,
  handleSubscriptionActivationEvent,
  handleSubscriptionCheckoutCompleted,
  handleSubscriptionDeletedEvent,
  isActivatingSubscriptionStatus,
  resolveCustomerEmail,
} from "./stripe-webhook";

const PERIOD_END_UNIX = 1_893_456_000;
const PERIOD_END_ISO = new Date(PERIOD_END_UNIX * 1000).toISOString();

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    customer: "cus_abc",
    items: {
      object: "list",
      data: [
        {
          id: "si_1",
          object: "subscription_item",
          current_period_end: PERIOD_END_UNIX,
          current_period_start: PERIOD_END_UNIX - 30 * 24 * 3600,
          price: {
            id: "price_month",
            object: "price",
            recurring: {
              interval: "month",
              interval_count: 1,
            },
          },
        },
      ],
      has_more: false,
      url: "",
    },
    ...overrides,
  } as Stripe.Subscription;
}

type ProfileRow = { id: string; stripe_customer_id?: string | null };

function makeSupabaseMock(handlers: {
  profileByCustomerId?: ProfileRow | null;
  profileById?: string | null;
  profileIdByEmail?: string | null;
  updateError?: string;
  /** Seat counters returned when profiles row is re-read for pending revoke. */
  seatProfile?: {
    purchased_debrief_seats?: number;
    purchased_evaluation_seats?: number;
    comp_debrief_seats?: number;
  };
  /** Mentor relationships returned for excess-pending revoke. */
  mentorRelationships?: Array<{
    id: string;
    status: string;
    created_at: string;
    seat_type?: string;
  }>;
}) {
  const updates: Array<{ id: string; values: Record<string, unknown> }> = [];
  const relationshipUpdates: Array<{
    ids: string[];
    values: Record<string, unknown>;
  }> = [];

  // Mutable seat row so writes are visible on the next capacity re-read.
  const seatRow = {
    purchased_debrief_seats: handlers.seatProfile?.purchased_debrief_seats ?? 0,
    purchased_evaluation_seats:
      handlers.seatProfile?.purchased_evaluation_seats ?? 0,
    comp_debrief_seats: handlers.seatProfile?.comp_debrief_seats ?? 0,
  };

  let relationshipFilterSeatType: string | null = null;

  const supabase = {
    from(table: string) {
      if (table === "mentor_relationships") {
        return {
          select() {
            return {
              eq(col: string, value: string) {
                if (col === "seat_type") {
                  relationshipFilterSeatType = value;
                }
                return {
                  eq(col2: string, value2: string) {
                    if (col2 === "seat_type") {
                      relationshipFilterSeatType = value2;
                    }
                    return {
                      in() {
                        return {
                          order() {
                            const seatType = relationshipFilterSeatType;
                            relationshipFilterSeatType = null;
                            const data = (handlers.mentorRelationships ?? [])
                              .filter(
                                (r) =>
                                  !seatType ||
                                  !r.seat_type ||
                                  r.seat_type === seatType,
                              )
                              .map(({ id, status, created_at }) => ({
                                id,
                                status,
                                created_at,
                              }));
                            return Promise.resolve({ data, error: null });
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          update(values: Record<string, unknown>) {
            return {
              in(_col: string, ids: string[]) {
                return {
                  eq() {
                    relationshipUpdates.push({ ids, values });
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
          },
        };
      }

      assert.equal(table, "profiles");
      return {
        select(_cols?: string) {
          return {
            eq(col: string, value: string) {
              return {
                async maybeSingle() {
                  if (col === "id" && handlers.profileById === value) {
                    // Seat re-read after provision uses multi-column select
                    // or just-written path reads comp only.
                    if (
                      _cols &&
                      (_cols.includes("purchased_debrief_seats") ||
                        _cols.includes("comp_debrief_seats"))
                    ) {
                      return { data: { ...seatRow }, error: null };
                    }
                    return { data: { id: value }, error: null };
                  }
                  if (
                    col === "stripe_customer_id" &&
                    handlers.profileByCustomerId?.stripe_customer_id === value
                  ) {
                    return { data: handlers.profileByCustomerId, error: null };
                  }
                  if (
                    col === "stripe_customer_id" &&
                    handlers.profileByCustomerId &&
                    value === "cus_abc"
                  ) {
                    return { data: handlers.profileByCustomerId, error: null };
                  }
                  return { data: null, error: null };
                },
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          return {
            eq(_col: string, id: string) {
              updates.push({ id, values });
              if (typeof values.purchased_debrief_seats === "number") {
                seatRow.purchased_debrief_seats = values.purchased_debrief_seats;
              }
              if (typeof values.purchased_evaluation_seats === "number") {
                seatRow.purchased_evaluation_seats =
                  values.purchased_evaluation_seats;
              }
              if (handlers.updateError) {
                return Promise.resolve({
                  error: { message: handlers.updateError },
                });
              }
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    rpc(fn: string, _args: { p_email: string }) {
      assert.equal(fn, "find_profile_id_by_email");
      return Promise.resolve({
        data: handlers.profileIdByEmail ?? null,
        error: null,
      });
    },
  } as unknown as SupabaseClient;

  return { supabase, updates, relationshipUpdates };
}

const activeProfileValues = {
  stripe_customer_id: "cus_abc",
  subscription_status: "active",
  subscription_interval: "month",
  current_period_end: PERIOD_END_ISO,
};

describe("extractSubscriptionBillingFields", () => {
  it("reads interval and period end from the first subscription item", () => {
    assert.deepEqual(extractSubscriptionBillingFields(makeSubscription()), {
      subscriptionInterval: "month",
      currentPeriodEnd: PERIOD_END_ISO,
    });
  });

  it("falls back to top-level current_period_end when item lacks it", () => {
    const subscription = makeSubscription({
      items: {
        object: "list",
        data: [
          {
            id: "si_1",
            object: "subscription_item",
            price: {
              id: "price_year",
              object: "price",
              recurring: { interval: "year", interval_count: 1 },
            },
          },
        ],
        has_more: false,
        url: "",
      },
    } as Partial<Stripe.Subscription>);
    (subscription as { current_period_end?: number }).current_period_end =
      PERIOD_END_UNIX;

    assert.deepEqual(extractSubscriptionBillingFields(subscription), {
      subscriptionInterval: "year",
      currentPeriodEnd: PERIOD_END_ISO,
    });
  });

  it("returns nulls when neither period end source is present", () => {
    const subscription = makeSubscription({
      items: {
        object: "list",
        data: [],
        has_more: false,
        url: "",
      },
    } as Partial<Stripe.Subscription>);

    assert.deepEqual(extractSubscriptionBillingFields(subscription), {
      subscriptionInterval: null,
      currentPeriodEnd: null,
    });
  });
});

describe("isActivatingSubscriptionStatus", () => {
  it("accepts active and trialing", () => {
    assert.equal(isActivatingSubscriptionStatus("active"), true);
    assert.equal(isActivatingSubscriptionStatus("trialing"), true);
  });

  it("rejects incomplete and past_due", () => {
    assert.equal(isActivatingSubscriptionStatus("incomplete"), false);
    assert.equal(isActivatingSubscriptionStatus("past_due"), false);
  });
});

describe("getMentorSeatTypeFromMetadata", () => {
  it("reads debrief and evaluation seat types", () => {
    assert.equal(
      getMentorSeatTypeFromMetadata({
        checkout_type: "mentor_seat",
        seat_type: "debrief",
      }),
      "debrief",
    );
    assert.equal(
      getMentorSeatTypeFromMetadata({
        checkout_type: "mentor_seat",
        seat_type: "evaluation",
      }),
      "evaluation",
    );
  });

  it("ignores Coach and pack metadata", () => {
    assert.equal(
      getMentorSeatTypeFromMetadata({ checkout_type: "subscription" }),
      null,
    );
    assert.equal(getMentorSeatTypeFromMetadata({ checkout_type: "pack" }), null);
  });
});

describe("mentor seat subscription lifecycle", () => {
  it("provisions purchased seats without setting Coach subscription_status", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileById: "user-mentor",
    });

    const seatSub = makeSubscription({
      metadata: {
        supabase_user_id: "user-mentor",
        checkout_type: "mentor_seat",
        seat_type: "debrief",
      },
      items: {
        object: "list",
        data: [
          {
            id: "si_1",
            object: "subscription_item",
            quantity: 2,
            current_period_end: PERIOD_END_UNIX,
            price: {
              id: "price_debrief",
              object: "price",
              recurring: { interval: "month", interval_count: 1 },
            },
          },
        ],
        has_more: false,
        url: "",
      },
    } as unknown as Partial<Stripe.Subscription>);

    const stripe = {
      subscriptions: {
        async list() {
          return { data: [seatSub], has_more: false };
        },
      },
    } as unknown as Stripe;

    const result = await handleSubscriptionActivationEvent(seatSub, {
      supabase,
      stripe,
      logError: () => {},
    });

    assert.equal(result.matched, true);
    assert.ok(
      updates.some(
        (u) =>
          u.id === "user-mentor" &&
          u.values.purchased_debrief_seats === 2 &&
          u.values.subscription_status === undefined,
      ),
    );
    assert.ok(
      updates.some(
        (u) =>
          u.id === "user-mentor" && u.values.stripe_customer_id === "cus_abc",
      ),
    );
  });

  it("clears purchased seats when mentor seat subscription is deleted", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileById: "user-mentor",
    });

    const deletedSub = makeSubscription({
      id: "sub_deleted",
      status: "canceled",
      metadata: {
        supabase_user_id: "user-mentor",
        checkout_type: "mentor_seat",
        seat_type: "evaluation",
      },
    });

    const stripe = {
      subscriptions: {
        async list() {
          return { data: [deletedSub], has_more: false };
        },
      },
    } as unknown as Stripe;

    const result = await handleSubscriptionDeletedEvent(deletedSub, {
      supabase,
      stripe,
      logError: () => {},
    });

    assert.equal(result.matched, true);
    assert.ok(
      updates.some(
        (u) =>
          u.id === "user-mentor" &&
          u.values.purchased_evaluation_seats === 0 &&
          u.values.subscription_status === undefined,
      ),
    );
  });

  it("revokes excess pending invites when mentor seat subscription is deleted", async () => {
    const { supabase, updates, relationshipUpdates } = makeSupabaseMock({
      profileById: "user-mentor",
      seatProfile: {
        purchased_debrief_seats: 3,
        purchased_evaluation_seats: 1,
        comp_debrief_seats: 0,
      },
      mentorRelationships: [
        {
          id: "active-1",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
          seat_type: "debrief",
        },
        {
          id: "active-2",
          status: "active",
          created_at: "2026-07-02T00:00:00Z",
          seat_type: "debrief",
        },
        {
          id: "pending-open",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
          seat_type: "debrief",
        },
      ],
    });

    const deletedSub = makeSubscription({
      id: "sub_debrief_cancelled",
      status: "canceled",
      metadata: {
        supabase_user_id: "user-mentor",
        checkout_type: "mentor_seat",
        seat_type: "debrief",
      },
    });

    const stripe = {
      subscriptions: {
        async list() {
          // Deleted sub is excluded via forceZero; no other active seat subs.
          return { data: [deletedSub], has_more: false };
        },
      },
    } as unknown as Stripe;

    const result = await handleSubscriptionDeletedEvent(deletedSub, {
      supabase,
      stripe,
      logError: () => {},
    });

    assert.equal(result.matched, true);
    assert.ok(
      updates.some(
        (u) =>
          u.id === "user-mentor" && u.values.purchased_debrief_seats === 0,
      ),
    );
    // Capacity 0 + 2 actives → all pending of debrief are revoked.
    assert.ok(
      relationshipUpdates.some(
        (u) =>
          u.values.status === "revoked" &&
          typeof u.values.ended_at === "string" &&
          u.ids.includes("pending-open"),
      ),
      `expected pending revoke, got ${JSON.stringify(relationshipUpdates)}`,
    );
    // Active ids must not be in a revoke batch.
    assert.ok(
      relationshipUpdates.every(
        (u) => !u.ids.includes("active-1") && !u.ids.includes("active-2"),
      ),
    );
  });
});

describe("resolveCustomerEmail", () => {
  it("reads email from expanded customer object", async () => {
    const subscription = makeSubscription({
      customer: {
        id: "cus_abc",
        object: "customer",
        email: "pastor@church.org",
      } as Stripe.Customer,
    });

    const stripe = {
      customers: {
        retrieve: async () => {
          throw new Error("should not retrieve when expanded");
        },
      },
    } as unknown as Stripe;

    assert.equal(
      await resolveCustomerEmail(stripe, subscription),
      "pastor@church.org",
    );
  });

  it("retrieves customer when event only includes customer id", async () => {
    const subscription = makeSubscription({ customer: "cus_abc" });
    const stripe = {
      customers: {
        retrieve: async (id: string) => {
          assert.equal(id, "cus_abc");
          return {
            id: "cus_abc",
            object: "customer",
            email: "pastor@church.org",
            deleted: false,
          } as Stripe.Customer;
        },
      },
    } as unknown as Stripe;

    assert.equal(
      await resolveCustomerEmail(stripe, subscription),
      "pastor@church.org",
    );
  });
});

describe("handleSubscriptionActivationEvent", () => {
  it("writes nothing when Stripe status is past_due", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });
    const errors: string[] = [];

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({ status: "past_due" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: (message) => errors.push(message),
      },
    );

    assert.equal(result.matched, true);
    assert.equal(updates.length, 0);
    assert.equal(errors.length, 0);
  });

  it("deactivates profile when Stripe status is unpaid", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({ status: "unpaid" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: { subscription_status: "inactive" },
      },
    ]);
  });

  it("deactivates profile when Stripe status is paused", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({ status: "paused" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: { subscription_status: "inactive" },
      },
    ]);
  });

  it("deactivates profile when Stripe status is incomplete_expired", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({ status: "incomplete_expired" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: { subscription_status: "inactive" },
      },
    ]);
  });

  it("deactivates profile when Stripe status is incomplete", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({ status: "incomplete" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: { subscription_status: "inactive" },
      },
    ]);
  });

  it("activates profile matched by subscription metadata supabase_user_id", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileById: "user-meta",
    });

    const result = await handleSubscriptionActivationEvent(
      makeSubscription({
        metadata: { supabase_user_id: "user-meta" },
      }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-meta",
        values: activeProfileValues,
      },
    ]);
  });

  it("activates profile matched by stripe_customer_id", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionActivationEvent(makeSubscription(), {
      supabase,
      stripe: {} as Stripe,
      logError: () => {},
    });

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: activeProfileValues,
      },
    ]);
  });

  it("bootstraps stripe_customer_id via email when no metadata or customer id match", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: null,
      profileIdByEmail: "user-2",
    });

    const errors: Array<{ message: string; meta?: Record<string, unknown> }> =
      [];
    const stripe = {
      customers: {
        retrieve: async () =>
          ({
            id: "cus_abc",
            object: "customer",
            email: "pastor@church.org",
            deleted: false,
          }) as Stripe.Customer,
      },
    } as unknown as Stripe;

    const result = await handleSubscriptionActivationEvent(makeSubscription(), {
      supabase,
      stripe,
      logError: (message, meta) => errors.push({ message, meta }),
    });

    assert.equal(result.matched, true);
    assert.match(errors[0].message, /legacy email match fallback/);
    assert.deepEqual(updates, [
      {
        id: "user-2",
        values: activeProfileValues,
      },
    ]);
  });

  it("logs and returns no-match without updating when email lookup misses", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: null,
      profileIdByEmail: null,
    });

    const errors: Array<{ message: string; meta?: Record<string, unknown> }> =
      [];
    const stripe = {
      customers: {
        retrieve: async () =>
          ({
            id: "cus_abc",
            object: "customer",
            email: "unknown@church.org",
            deleted: false,
          }) as Stripe.Customer,
      },
    } as unknown as Stripe;

    const result = await handleSubscriptionActivationEvent(makeSubscription(), {
      supabase,
      stripe,
      logError: (message, meta) => errors.push({ message, meta }),
    });

    assert.equal(result.matched, false);
    assert.equal(updates.length, 0);
    assert.equal(errors.length, 2);
    assert.match(errors[0].message, /legacy email match fallback/);
    assert.match(errors[1].message, /No Supabase profile match/);
    assert.equal(errors[1].meta?.customerId, "cus_abc");
  });
});

describe("handleSubscriptionDeletedEvent", () => {
  it("writes inactive for a matched profile", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const result = await handleSubscriptionDeletedEvent(
      makeSubscription({ status: "canceled" }),
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-1",
        values: { subscription_status: "inactive" },
      },
    ]);
  });
});

describe("handleInvoicePaymentFailed", () => {
  it("skips when invoice has no subscription parent", async () => {
    const { supabase, updates } = makeSupabaseMock({});
    const errors: Array<{ message: string }> = [];

    const result = await handleInvoicePaymentFailed(
      {
        id: "in_1",
        object: "invoice",
        customer: "cus_abc",
        parent: null,
      } as Stripe.Invoice,
      {
        supabase,
        stripe: {} as Stripe,
        logError: (message) => errors.push({ message }),
      },
    );

    assert.equal(result.matched, false);
    assert.match(result.skipped ?? "", /no subscription id/);
    assert.equal(updates.length, 0);
    assert.equal(errors.length, 1);
  });

  it("leaves subscription_status untouched for a matched profile", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: { id: "user-1", stripe_customer_id: "cus_abc" },
    });

    const stripe = {
      subscriptions: {
        retrieve: async (id: string) => {
          assert.equal(id, "sub_123");
          return makeSubscription({ metadata: {} });
        },
      },
    } as unknown as Stripe;

    const result = await handleInvoicePaymentFailed(
      {
        id: "in_1",
        object: "invoice",
        customer: "cus_abc",
        parent: {
          type: "subscription_details",
          subscription_details: {
            subscription: "sub_123",
          },
          quote_details: null,
        },
      } as Stripe.Invoice,
      {
        supabase,
        stripe,
        logError: () => {},
      },
    );

    assert.equal(result.matched, true);
    assert.equal(updates.length, 0);
  });
});

describe("handleSubscriptionCheckoutCompleted", () => {
  it("activates profile from client_reference_id on subscription checkout", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileById: "user-checkout",
    });

    const stripe = {
      subscriptions: {
        retrieve: async (id: string) => {
          assert.equal(id, "sub_123");
          return makeSubscription();
        },
      },
    } as unknown as Stripe;

    await handleSubscriptionCheckoutCompleted(
      {
        id: "cs_123",
        object: "checkout.session",
        mode: "subscription",
        client_reference_id: "user-checkout",
        customer: "cus_abc",
        subscription: "sub_123",
      } as Stripe.Checkout.Session,
      {
        supabase,
        stripe,
        logError: () => {},
      },
    );

    assert.deepEqual(updates, [
      {
        id: "user-checkout",
        values: activeProfileValues,
      },
    ]);
  });

  it("activates with null billing fields when subscription retrieve fails", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileById: "user-checkout",
    });
    const errors: string[] = [];

    const stripe = {
      subscriptions: {
        retrieve: async () => {
          throw new Error("stripe down");
        },
      },
    } as unknown as Stripe;

    await handleSubscriptionCheckoutCompleted(
      {
        id: "cs_123",
        object: "checkout.session",
        mode: "subscription",
        client_reference_id: "user-checkout",
        customer: "cus_abc",
        subscription: "sub_123",
      } as Stripe.Checkout.Session,
      {
        supabase,
        stripe,
        logError: (message) => errors.push(message),
      },
    );

    assert.match(errors[0] ?? "", /failed to retrieve subscription/i);
    assert.deepEqual(updates, [
      {
        id: "user-checkout",
        values: {
          stripe_customer_id: "cus_abc",
          subscription_status: "active",
          subscription_interval: null,
          current_period_end: null,
        },
      },
    ]);
  });

  it("ignores non-subscription checkout sessions", async () => {
    const { supabase, updates } = makeSupabaseMock({});

    await handleSubscriptionCheckoutCompleted(
      {
        id: "cs_123",
        object: "checkout.session",
        mode: "payment",
        client_reference_id: "user-checkout",
        customer: "cus_abc",
      } as Stripe.Checkout.Session,
      {
        supabase,
        stripe: {} as Stripe,
        logError: () => {},
      },
    );

    assert.equal(updates.length, 0);
  });
});
