import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  firstTouchUtmCookie,
  readSignupUtm,
  UTM_COOKIE_MAX_AGE_SECONDS,
} from "./utm-capture";

const LANDING =
  "?utm_source=test&utm_medium=manual&utm_campaign=utmcheck&utm_content=v1";

describe("firstTouchUtmCookie", () => {
  it("writes the five fields from the first utm visit", () => {
    const cookie = firstTouchUtmCookie(LANDING, "/", "");
    assert.ok(cookie);
    assert.match(cookie, /^sc_utm=/);
    assert.match(cookie, new RegExp(`Max-Age=${UTM_COOKIE_MAX_AGE_SECONDS}`));
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /SameSite=Lax/);

    const value = cookie.slice("sc_utm=".length, cookie.indexOf(";"));
    assert.deepEqual(readSignupUtm(`sc_utm=${value}`), {
      utm_source: "test",
      utm_medium: "manual",
      utm_campaign: "utmcheck",
      utm_content: "v1",
      landing_path: "/",
    });
  });

  it("stores the pathname and drops the query", () => {
    const cookie = firstTouchUtmCookie(
      "?utm_source=ad",
      "/pricing.html",
      "",
    );
    assert.ok(cookie);
    const value = cookie.slice("sc_utm=".length, cookie.indexOf(";"));
    assert.equal(
      readSignupUtm(`sc_utm=${decodeURIComponent(value)}`).landing_path,
      "/pricing.html",
    );
  });

  it("does not write when the URL has no utm_ parameter", () => {
    assert.equal(firstTouchUtmCookie("", "/", ""), null);
    assert.equal(firstTouchUtmCookie("?plan=coach", "/", ""), null);
  });

  it("does not overwrite an existing sc_utm cookie", () => {
    const existing = firstTouchUtmCookie(LANDING, "/", "");
    assert.ok(existing);
    assert.equal(
      firstTouchUtmCookie("?utm_source=later", "/start", existing),
      null,
    );
  });
});

describe("readSignupUtm", () => {
  it("returns nulls when the cookie is absent", () => {
    assert.deepEqual(readSignupUtm(""), {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      landing_path: null,
    });
  });
});
