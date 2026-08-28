import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSendSeatEndEmail } from "./notify-seat-end";

describe("shouldSendSeatEndEmail", () => {
  it("sends only for an ended relationship with a mentee and no stamp", () => {
    assert.equal(
      shouldSendSeatEndEmail({
        status: "ended",
        mentee_id: "mentee-1",
        seat_end_email_sent_at: null,
      }),
      true,
    );
  });

  it("does not send for a revoked pending invite", () => {
    assert.equal(
      shouldSendSeatEndEmail({
        status: "revoked",
        mentee_id: null,
        seat_end_email_sent_at: null,
      }),
      false,
    );
  });

  it("does not send when no mentee accepted", () => {
    assert.equal(
      shouldSendSeatEndEmail({
        status: "ended",
        mentee_id: null,
        seat_end_email_sent_at: null,
      }),
      false,
    );
  });

  it("skips when already stamped", () => {
    assert.equal(
      shouldSendSeatEndEmail({
        status: "ended",
        mentee_id: "mentee-1",
        seat_end_email_sent_at: "2026-08-28T15:00:00Z",
      }),
      false,
    );
  });
});
