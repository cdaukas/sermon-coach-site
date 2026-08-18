import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_UNVERIFIED_PURGE_ALLOWLIST,
  UNVERIFIED_PURGE_MAX_AGE_MS,
  parseUnverifiedPurgeAllowlist,
  selectUnverifiedPurgeCandidates,
  type AuthUserLike,
} from "./purge-unverified";

function user(overrides: Partial<AuthUserLike> & Pick<AuthUserLike, "id">): AuthUserLike {
  return {
    email: "bot@aol.com",
    email_confirmed_at: null,
    last_sign_in_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const nowMs = Date.parse("2026-08-17T00:00:00.000Z");

describe("parseUnverifiedPurgeAllowlist", () => {
  it("always includes the owner address and extra CSV entries", () => {
    const list = parseUnverifiedPurgeAllowlist("chris@sermoncoach.online, pastor@test.org");
    assert.ok(list.includes("cdaukas@gmail.com"));
    assert.ok(list.includes("chris@sermoncoach.online"));
    assert.ok(list.includes("pastor@test.org"));
  });
});

describe("selectUnverifiedPurgeCandidates", () => {
  it("selects stale unverified users and skips allowlisted, confirmed, and signed-in", () => {
    const { candidates, skippedAllowlist } = selectUnverifiedPurgeCandidates(
      [
        user({ id: "stale-bot" }),
        user({
          id: "owner",
          email: "c.daukas@gmail.com",
        }),
        user({
          id: "confirmed",
          email: "pastor@church.org",
          email_confirmed_at: "2026-08-02T00:00:00.000Z",
        }),
        user({
          id: "signed-in",
          last_sign_in_at: "2026-08-03T00:00:00.000Z",
        }),
        user({
          id: "fresh",
          created_at: "2026-08-16T00:00:00.000Z",
        }),
      ],
      {
        nowMs,
        maxAgeMs: UNVERIFIED_PURGE_MAX_AGE_MS,
        allowlist: parseUnverifiedPurgeAllowlist(undefined),
      },
    );

    assert.deepEqual(
      candidates.map((row) => row.id),
      ["stale-bot"],
    );
    assert.deepEqual(
      skippedAllowlist.map((row) => row.id),
      ["owner"],
    );
    assert.deepEqual(DEFAULT_UNVERIFIED_PURGE_ALLOWLIST, ["cdaukas@gmail.com"]);
  });
});
