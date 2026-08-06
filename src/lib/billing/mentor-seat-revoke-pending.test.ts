import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revokeExcessPendingMentorInvites } from "./mentor-seat-revoke-pending";

type Row = {
  id: string;
  status: string;
  created_at: string;
};

function makeMentorSupabase(opts: {
  profile: {
    purchased_debrief_seats: number;
    purchased_evaluation_seats: number;
    comp_debrief_seats: number;
  };
  rows: Row[];
}) {
  const updates: Array<{ ids: string[]; values: Record<string, unknown> }> = [];

  const supabase = {
    from(table: string) {
      if (table === "profiles") {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return { data: opts.profile, error: null };
                  },
                };
              },
            };
          },
        };
      }
      if (table === "mentor_relationships") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      in() {
                        return {
                          order() {
                            return Promise.resolve({
                              data: opts.rows,
                              error: null,
                            });
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
                    updates.push({ ids, values });
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;

  return { supabase, updates };
}

describe("revokeExcessPendingMentorInvites", () => {
  it("revokes all pending of a type when capacity is zero", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "p1",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          id: "a1",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");

    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["p1"]);
    assert.equal(updates[0].values.status, "revoked");
    assert.equal(typeof updates[0].values.ended_at, "string");
  });

  it("keeps pending that still fit under capacity after actives", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 2,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "p-old",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          id: "p-new",
          status: "pending",
          created_at: "2026-08-05T00:00:00Z",
        },
        {
          id: "a1",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
    });

    // capacity 2, active 1 → keep 1 pending (newest), revoke oldest
    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");

    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["p-old"]);
  });

  it("counts comp debrief seats toward capacity", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 1,
      },
      rows: [
        {
          id: "p1",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");
    assert.equal(updates.length, 0);
  });
});
