import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import { stripeCustomer } from "../test-support/sdk-fixtures";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateStripeCustomer } from "./stripe-customer";

function makeSupabaseMock(handlers: {
  stripeCustomerId?: string | null;
  updateError?: string;
}) {
  const updates: Array<{ id: string; values: Record<string, string> }> = [];

  const supabase = {
    from(table: string) {
      assert.equal(table, "profiles");
      return {
        select() {
          return {
            eq(_col: string, id: string) {
              return {
                async maybeSingle() {
                  return {
                    data:
                      handlers.stripeCustomerId === undefined
                        ? { stripe_customer_id: null }
                        : { stripe_customer_id: handlers.stripeCustomerId },
                    error: null,
                  };
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
  } as unknown as SupabaseClient;

  return { supabase, updates };
}

describe("getOrCreateStripeCustomer", () => {
  it("returns existing customer and syncs email when it differs", async () => {
    const { supabase } = makeSupabaseMock({ stripeCustomerId: "cus_existing" });
    const updated: Array<{ id: string; email: string }> = [];

    const stripe = {
      customers: {
        retrieve: async (id: string) => {
          assert.equal(id, "cus_existing");
          return stripeCustomer({
            id: "cus_existing",
            email: "old@church.org",
          });
        },
        update: async (id: string, params: { email?: string }) => {
          updated.push({ id, email: params.email ?? "" });
          return stripeCustomer();
        },
        create: async () => {
          throw new Error("should not create when customer exists");
        },
      },
    } as unknown as Stripe;

    const customerId = await getOrCreateStripeCustomer(stripe, supabase, {
      userId: "user-1",
      email: "pastor@church.org",
    });

    assert.equal(customerId, "cus_existing");
    assert.deepEqual(updated, [
      { id: "cus_existing", email: "pastor@church.org" },
    ]);
  });

  it("creates a customer and stores stripe_customer_id on the profile", async () => {
    const { supabase, updates } = makeSupabaseMock({ stripeCustomerId: null });

    const stripe = {
      customers: {
        retrieve: async () => {
          throw new Error("should not retrieve when no customer id");
        },
        create: async (params: Stripe.CustomerCreateParams) => {
          assert.equal(params.email, "pastor@church.org");
          // Stripe types metadata as `MetadataParam | ""` because "" is the
          // sentinel meaning "delete all metadata". Narrow off it before
          // reading the key, rather than widening or casting the assertion.
          const metadata = params.metadata;
          if (typeof metadata !== "object" || metadata === null) {
            assert.fail(
              `expected a metadata object, got ${JSON.stringify(metadata)}`,
            );
          }
          assert.equal(metadata.supabase_user_id, "user-2");
          return stripeCustomer({ id: "cus_new" });
        },
      },
    } as unknown as Stripe;

    const customerId = await getOrCreateStripeCustomer(stripe, supabase, {
      userId: "user-2",
      email: "pastor@church.org",
    });

    assert.equal(customerId, "cus_new");
    assert.deepEqual(updates, [
      {
        id: "user-2",
        values: { stripe_customer_id: "cus_new" },
      },
    ]);
  });
});
