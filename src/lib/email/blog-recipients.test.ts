import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyInternalAccountFilter,
  applySuppressionFilter,
  applyTestFixtureFilter,
  isInternalTestAccount,
  isTestFixtureAccount,
  matchTestFixtureRule,
  mergeRecipientSources,
} from "./blog-recipients";

describe("internal test account filter", () => {
  it("matches cdaukas@gmail.com and plus-addressed variants only", () => {
    assert.equal(isInternalTestAccount("cdaukas@gmail.com"), true);
    assert.equal(isInternalTestAccount("cdaukas+demo6@gmail.com"), true);
    assert.equal(isInternalTestAccount("cdaukas+welltest2@gmail.com"), true);
    assert.equal(isInternalTestAccount("cdaukas+demo@gmail.com"), true);
    assert.equal(isInternalTestAccount("chrisd@gtn.org"), false);
    assert.equal(isInternalTestAccount("cdaukas@live.com"), false);
    assert.equal(isInternalTestAccount("notcdaukas@gmail.com"), false);
  });

  it("excludes internal accounts before suppression", () => {
    const recipients = [
      { userId: "1", email: "chrisd@gtn.org" },
      { userId: "2", email: "cdaukas@gmail.com" },
      { userId: "3", email: "cdaukas+demo@gmail.com" },
      { userId: "4", email: "reader@example.com" },
    ];

    const { eligible, internalExcludedCount } =
      applyInternalAccountFilter(recipients);

    assert.equal(internalExcludedCount, 2);
    assert.deepEqual(
      eligible.map((row) => row.email),
      ["chrisd@gtn.org", "reader@example.com"],
    );
  });
});

describe("test fixture filter", () => {
  it("matches local-part prefixes on any domain, not only example.com", () => {
    assert.equal(matchTestFixtureRule("sketch-prod-xxx@gmail.com"), "sketch-");
    assert.equal(matchTestFixtureRule("acq-test@live.com"), "acq-");
    assert.equal(matchTestFixtureRule("rr-foo@sermoncoach.online"), "rr-");
    assert.equal(matchTestFixtureRule("reader@example.com"), "example.com");
    assert.equal(matchTestFixtureRule("pastor@realchurch.org"), null);
    assert.equal(isTestFixtureAccount("sketch-prod-xxx@gmail.com"), true);
  });

  it("excludes fixture emails from the eligible list", () => {
    const recipients = [
      { userId: "1", email: "pastor@realchurch.org" },
      { userId: "2", email: "sketch-prod-xxx@gmail.com" },
      { userId: "3", email: "reader@example.com" },
    ];

    const { eligible, fixtureExcludedCount } =
      applyTestFixtureFilter(recipients);

    assert.equal(fixtureExcludedCount, 2);
    assert.deepEqual(
      eligible.map((row) => row.email),
      ["pastor@realchurch.org"],
    );
  });
});

describe("blog recipient suppression", () => {
  it("excludes suppressed emails", () => {
    const recipients = [
      { userId: "1", email: "alpha@example.com" },
      { userId: "2", email: "beta@example.com" },
      { userId: "3", email: "gamma@example.com" },
    ];
    const suppressed = new Set(["beta@example.com"]);

    const { eligible, suppressedCount } = applySuppressionFilter(
      recipients,
      suppressed,
    );

    assert.equal(eligible.length, 2);
    assert.equal(suppressedCount, 1);
    assert.deepEqual(
      eligible.map((row) => row.email),
      ["alpha@example.com", "gamma@example.com"],
    );
  });
});

describe("recipient source merge", () => {
  it("dedupes by email and prefers auth account rows", () => {
    const accounts = [
      { userId: "user-1", email: "shared@example.com" },
      { userId: "user-2", email: "account-only@example.com" },
    ];
    const newsletter = [
      { userId: null, email: "shared@example.com" },
      { userId: null, email: "newsletter-only@example.com" },
    ];

    const merged = mergeRecipientSources(accounts, newsletter);

    assert.equal(merged.length, 3);
    assert.deepEqual(
      merged.map((row) => row.email),
      [
        "account-only@example.com",
        "newsletter-only@example.com",
        "shared@example.com",
      ],
    );
    assert.equal(
      merged.find((row) => row.email === "shared@example.com")?.userId,
      "user-1",
    );
  });
});
