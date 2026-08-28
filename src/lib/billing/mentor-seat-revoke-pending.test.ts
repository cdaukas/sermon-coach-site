import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  revokeExcessPendingForMentor,
  revokeExcessPendingMentorInvites,
} from "./mentor-seat-revoke-pending";

type Row = {
  id: string;
  status: string;
  created_at: string;
  seat_type?: string;
};

function makeMentorSupabase(opts: {
  profile: {
    purchased_debrief_seats: number;
    purchased_evaluation_seats: number;
    comp_debrief_seats: number;
  };
  rows: Row[];
}) {
  const updates: Array<{
    table: string;
    ids: string[];
    values: Record<string, unknown>;
    statusGuard?: string;
  }> = [];
  const profileUpdates: Array<Record<string, unknown>> = [];
  const tablesTouched: string[] = [];

  const supabase = {
    from(table: string) {
      tablesTouched.push(table);
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
          update(values: Record<string, unknown>) {
            profileUpdates.push(values);
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === "mentor_relationships") {
        return {
          select() {
            return {
              eq(_col: string, value: string) {
                return {
                  eq(_col2: string, value2: string) {
                    const seatType = _col === "seat_type" ? value : value2;
                    return {
                      in() {
                        return {
                          order() {
                            const data = opts.rows
                              .filter(
                                (r) =>
                                  !r.seat_type || r.seat_type === seatType,
                              )
                              .map(({ id, status, created_at }) => ({
                                id,
                                status,
                                created_at,
                              }));
                            return Promise.resolve({
                              data,
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
                  eq(_statusCol: string, statusGuard: string) {
                    updates.push({
                      table: "mentor_relationships",
                      ids,
                      values,
                      statusGuard,
                    });
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

  return { supabase, updates, profileUpdates, tablesTouched };
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
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");

    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["p1"]);
    assert.equal(updates[0].values.status, "revoked");
    assert.equal(updates[0].statusGuard, "pending");
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
    assert.equal(updates[0].values.status, "revoked");
  });

  it("counts comp debrief seats toward capacity", async () => {
    const { supabase, updates, profileUpdates } = makeMentorSupabase({
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
    assert.equal(profileUpdates.length, 0);
  });

  it("uses purchasedSeats override instead of profile re-read", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        // Stale high purchase that would incorrectly keep all pending.
        purchased_debrief_seats: 10,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "p1",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief", {
      purchasedSeats: 0,
    });

    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["p1"]);
  });

  it("ends a single active relationship when capacity is zero", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "a1",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");

    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["a1"]);
    assert.equal(updates[0].values.status, "ended");
    assert.equal(updates[0].statusGuard, "active");
    assert.equal(typeof updates[0].values.ended_at, "string");
  });

  it("does not write released_to_mentee_at when ending an active relationship", async () => {
    const { supabase, updates, tablesTouched } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "a-held",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "evaluation");

    assert.ok(!tablesTouched.includes("sermon_evaluations"));
    assert.equal(updates.length, 1);
    assert.equal(updates[0].values.status, "ended");
    assert.equal("released_to_mentee_at" in updates[0].values, false);
  });

  it("revokes both pending first, then ends the oldest active, when capacity drops to 1", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 1,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "a-old",
          status: "active",
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "a-new",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
        {
          id: "p-old",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          id: "p-new",
          status: "pending",
          created_at: "2026-08-15T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief");

    assert.equal(updates.length, 2);
    assert.equal(updates[0].values.status, "revoked");
    assert.equal(updates[0].statusGuard, "pending");
    assert.deepEqual(updates[0].ids, ["p-old", "p-new"]);
    assert.equal(updates[1].values.status, "ended");
    assert.equal(updates[1].statusGuard, "active");
    assert.deepEqual(updates[1].ids, ["a-old"]);
  });

  it("leaves the newer active when cancelling purchased seats if a comp seat remains", async () => {
    const { supabase, updates, profileUpdates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 1,
      },
      rows: [
        {
          id: "a-old",
          status: "active",
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "a-new",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "debrief", {
      purchasedSeats: 0,
    });

    assert.equal(profileUpdates.length, 0);
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].ids, ["a-old"]);
    assert.equal(updates[0].values.status, "ended");
  });

  it("recomputes both seat types for a mentor", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 0,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "p-deb",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
          seat_type: "debrief",
        },
      ],
    });

    await revokeExcessPendingForMentor(supabase, "mentor-1", {
      written: { seatType: "debrief", purchasedSeats: 0 },
    });

    // Both types run; debrief has a pending row to revoke.
    assert.ok(updates.length >= 1);
    assert.ok(updates.some((u) => u.ids.includes("p-deb")));
  });

  it("does not close the other seat type's relationships", async () => {
    const { supabase, updates } = makeMentorSupabase({
      profile: {
        purchased_debrief_seats: 1,
        purchased_evaluation_seats: 0,
        comp_debrief_seats: 0,
      },
      rows: [
        {
          id: "eval-active",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
          seat_type: "evaluation",
        },
        {
          id: "eval-pending",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
          seat_type: "evaluation",
        },
        {
          id: "deb-active",
          status: "active",
          created_at: "2026-07-01T00:00:00Z",
          seat_type: "debrief",
        },
        {
          id: "deb-pending",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
          seat_type: "debrief",
        },
      ],
    });

    await revokeExcessPendingMentorInvites(supabase, "mentor-1", "evaluation", {
      purchasedSeats: 0,
    });

    const touched = updates.flatMap((u) => u.ids);
    assert.ok(touched.includes("eval-pending"));
    assert.ok(touched.includes("eval-active"));
    assert.ok(!touched.includes("deb-active"));
    assert.ok(!touched.includes("deb-pending"));
  });
});
