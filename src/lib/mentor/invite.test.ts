import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mentorAcceptPathWithToken,
  mentorTokenFromNextPath,
  messageForAcceptError,
  parseAcceptMentorInviteResult,
  resolveMentorInviteToken,
} from "./invite";

describe("resolveMentorInviteToken", () => {
  it("prefers query param over cookie", () => {
    assert.equal(resolveMentorInviteToken("from-cookie", "from-param"), "from-param");
  });

  it("falls back to cookie", () => {
    assert.equal(resolveMentorInviteToken("from-cookie", null), "from-cookie");
  });

  it("returns null when both empty", () => {
    assert.equal(resolveMentorInviteToken("  ", ""), null);
  });
});

describe("mentorAcceptPathWithToken", () => {
  it("builds accept path with encoded token", () => {
    assert.equal(
      mentorAcceptPathWithToken("abc-123"),
      "/mentor/accept?token=abc-123",
    );
  });
});

describe("mentorTokenFromNextPath", () => {
  it("extracts token from accept next path", () => {
    assert.equal(
      mentorTokenFromNextPath("/mentor/accept?token=tok-1"),
      "tok-1",
    );
  });

  it("rejects non-accept paths", () => {
    assert.equal(mentorTokenFromNextPath("/start?claim=tok"), null);
  });
});

describe("messageForAcceptError", () => {
  it("maps known codes", () => {
    assert.equal(
      messageForAcceptError("already_mentored"),
      "You're already in a mentoring relationship. You can only have one mentor at a time.",
    );
    assert.equal(
      messageForAcceptError("self_invite"),
      "You can't accept your own invitation.",
    );
  });
});

describe("parseAcceptMentorInviteResult", () => {
  it("parses ok result", () => {
    assert.deepEqual(
      parseAcceptMentorInviteResult({
        ok: true,
        error_code: null,
        relationship_id: "rel-1",
      }),
      { ok: true, error_code: null, relationship_id: "rel-1" },
    );
  });

  it("parses error result", () => {
    assert.deepEqual(
      parseAcceptMentorInviteResult({
        ok: false,
        error_code: "invalid_or_used",
        relationship_id: null,
      }),
      { ok: false, error_code: "invalid_or_used", relationship_id: null },
    );
  });
});
