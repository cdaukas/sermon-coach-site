import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mentorSeatCapacityIsPositive,
  parseMentorSeatCapacityPayload,
} from "./capacity-parse";

describe("parseMentorSeatCapacityPayload", () => {
  it("returns null when the RPC did not succeed", () => {
    assert.equal(parseMentorSeatCapacityPayload(null), null);
    assert.equal(
      parseMentorSeatCapacityPayload({ ok: false, error_code: "not_authenticated" }),
      null,
    );
  });

  it("reads both seat slices", () => {
    const capacity = parseMentorSeatCapacityPayload({
      ok: true,
      debrief: { used: 0, capacity: 1, purchased: 1, comp: 0 },
      evaluation: { used: 0, capacity: 0, purchased: 0, comp: 0 },
    });
    assert.ok(capacity);
    assert.equal(capacity.debrief.capacity, 1);
    assert.equal(capacity.evaluation.capacity, 0);
    assert.equal(mentorSeatCapacityIsPositive(capacity), true);
  });

  it("treats 0/0 as not yet provisioned", () => {
    const capacity = parseMentorSeatCapacityPayload({
      ok: true,
      debrief: { used: 0, capacity: 0, purchased: 0, comp: 0 },
      evaluation: { used: 0, capacity: 0, purchased: 0, comp: 0 },
    });
    assert.ok(capacity);
    assert.equal(mentorSeatCapacityIsPositive(capacity), false);
  });
});
