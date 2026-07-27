import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserSiteOrigin,
  preferCanonicalOrigin,
  publicSiteOrigin,
  isSermonCoachProductionHost,
} from "./site-origin";

describe("isSermonCoachProductionHost", () => {
  it("accepts apex and www", () => {
    assert.equal(isSermonCoachProductionHost("sermoncoach.online"), true);
    assert.equal(isSermonCoachProductionHost("www.sermoncoach.online"), true);
    assert.equal(isSermonCoachProductionHost("localhost"), false);
  });
});

describe("preferCanonicalOrigin", () => {
  it("rewrites apex to www", () => {
    assert.equal(
      preferCanonicalOrigin("https://sermoncoach.online"),
      "https://www.sermoncoach.online",
    );
  });

  it("keeps www and localhost", () => {
    assert.equal(
      preferCanonicalOrigin("https://www.sermoncoach.online"),
      "https://www.sermoncoach.online",
    );
    assert.equal(
      preferCanonicalOrigin("http://127.0.0.1:3456"),
      "http://127.0.0.1:3456",
    );
  });
});

describe("publicSiteOrigin", () => {
  it("keeps localhost when hostname is local", () => {
    assert.equal(
      publicSiteOrigin("localhost", "http://localhost:3456"),
      "http://localhost:3456",
    );
  });
});

describe("browserSiteOrigin", () => {
  it("is defined for server import", () => {
    assert.equal(typeof browserSiteOrigin, "function");
  });
});
