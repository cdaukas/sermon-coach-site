import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserSiteOrigin,
  preferCanonicalOrigin,
  publicSiteOrigin,
  isSermonCoachProductionHost,
} from "./site-origin";

describe("isSermonCoachProductionHost", () => {
  it("accepts apex and www on sermoncoach.com", () => {
    assert.equal(isSermonCoachProductionHost("sermoncoach.com"), true);
    assert.equal(isSermonCoachProductionHost("www.sermoncoach.com"), true);
    assert.equal(isSermonCoachProductionHost("localhost"), false);
    assert.equal(isSermonCoachProductionHost("sermoncoach.online"), false);
  });
});

describe("preferCanonicalOrigin", () => {
  it("rewrites www and legacy hosts to apex", () => {
    assert.equal(
      preferCanonicalOrigin("https://www.sermoncoach.com"),
      "https://sermoncoach.com",
    );
    assert.equal(
      preferCanonicalOrigin("https://sermoncoach.online"),
      "https://sermoncoach.com",
    );
    assert.equal(
      preferCanonicalOrigin("https://www.sermoncoach.online"),
      "https://sermoncoach.com",
    );
  });

  it("keeps apex and localhost", () => {
    assert.equal(
      preferCanonicalOrigin("https://sermoncoach.com"),
      "https://sermoncoach.com",
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
