import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getClientIp } from "./rate-limit";

function requestWithForwarded(value: string | null): Request {
  const headers = new Headers();
  if (value !== null) headers.set("x-forwarded-for", value);
  return new Request("https://example.com/api", { headers });
}

describe("getClientIp", () => {
  it("uses the left-most x-forwarded-for entry", () => {
    assert.equal(
      getClientIp(requestWithForwarded("1.2.3.4, 5.6.7.8, 9.10.11.12")),
      "1.2.3.4",
    );
  });

  it("trims whitespace around the first entry", () => {
    assert.equal(
      getClientIp(requestWithForwarded("  1.2.3.4  , 5.6.7.8")),
      "1.2.3.4",
    );
  });

  it("returns unknown when header is absent", () => {
    assert.equal(getClientIp(requestWithForwarded(null)), "unknown");
  });

  it("returns unknown when header is empty", () => {
    assert.equal(getClientIp(requestWithForwarded("")), "unknown");
    assert.equal(getClientIp(requestWithForwarded("   ")), "unknown");
  });
});
