import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SIGNUP_MAX_PER_DAY,
  SIGNUP_MAX_PER_HOUR,
  clientIpFromForwardedFor,
  startOfUtcDayIso,
} from "./signup-rate-limit";

describe("clientIpFromForwardedFor", () => {
  it("returns left-most hop and null when missing", () => {
    assert.equal(
      clientIpFromForwardedFor("1.2.3.4, 5.6.7.8"),
      "1.2.3.4",
    );
    assert.equal(clientIpFromForwardedFor("  9.8.7.6  "), "9.8.7.6");
    assert.equal(clientIpFromForwardedFor(null), null);
    assert.equal(clientIpFromForwardedFor(""), null);
    assert.equal(clientIpFromForwardedFor("   "), null);
  });
});

describe("signup rate constants", () => {
  it("exposes the intended loose limits", () => {
    assert.equal(SIGNUP_MAX_PER_HOUR, 3);
    assert.equal(SIGNUP_MAX_PER_DAY, 8);
  });

  it("startOfUtcDayIso is midnight UTC today", () => {
    const iso = startOfUtcDayIso();
    assert.match(iso, /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
  });
});
