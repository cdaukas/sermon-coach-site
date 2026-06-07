import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  handleSubscriptionActivationEvent,
  isActivatingSubscriptionStatus,
  resolveCustomerEmail,
} from "./stripe-webhook";

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    customer: "cus_abc",
    ...overrides,
  } as Stripe.Subscription;
}

type ProfileRow = { id: string; stripe_customer_id?: string | null };

function makeSupabaseMock(handlers: {
  profileByCustomerId?: ProfileRow | null;
  profileIdByEmail?: string | null;
  updateError?: string;
}) {
  const updates: Array<{ id: string; values: Record<string, string> }> = [];

  const supabase = {
    from(table: string) {
      assert.equal(table, "profiles");
      return {
        select() {
          return {
            eq(_col: string, customerId: string) {
              return {
                async maybeSingle() {
                  if (
                    handlers.profileByCustomerId?.stripe_customer_id ===
                    customerId
                  ) {
                    return { data: handlers.profileByCustomerId, error: null };
                  }
                  if (
                    handlers.profileByCustomerId &&
                    customerId === "cus_abc"
                  ) {
                    return { data: handlers.profileByCustomerId, error: null };
                  }
                  return { data: null, error: null };
                },
              };
            },
          };
        },
        update(values: Record<string, string>) {
          return {
            eq(_col: string, id: string) {
              updates.push({ id, values });
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
    rpc(fn: string, args: { p_email: string }) {
      assert.equal(fn, "find_profile_id_by_email");
      return Promise.resolve({
        data: handlers.profileIdByEmail ?? null,
        error: null,
      });
    },
  } as unknown as SupabaseClient;

  return { supabase, updates };
}

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
  it("ignores non-activating subscription statuses", async () => {
    const { supabase, updates } = makeSupabaseMock({});
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
        values: {
          stripe_customer_id: "cus_abc",
          subscription_status: "active",
        },
      },
    ]);
  });

  it("bootstraps stripe_customer_id via email when no customer id match", async () => {
    const { supabase, updates } = makeSupabaseMock({
      profileByCustomerId: null,
      profileIdByEmail: "user-2",
    });

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
      logError: () => {},
    });

    assert.equal(result.matched, true);
    assert.deepEqual(updates, [
      {
        id: "user-2",
        values: {
          stripe_customer_id: "cus_abc",
          subscription_status: "active",
        },
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
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /No Supabase profile match/);
    assert.equal(errors[0].meta?.email, "unknown@church.org");
    assert.equal(errors[0].meta?.customerId, "cus_abc");
  });
});
