import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assembleOperatorDigest,
  digestSubject,
  formatIntervalLabel,
  isNeverActivated,
  LIST_TRUNCATE,
  operatorDisplayName,
  renderOperatorDigestHtml,
  type DigestProfile,
} from "./digest";

const now = new Date("2026-08-21T13:00:00.000Z");

function profile(
  overrides: Partial<DigestProfile> & Pick<DigestProfile, "id">,
): DigestProfile {
  return {
    display_name: "Pat",
    normalized_email: "pat@church.org",
    plan_tier: "coach",
    subscription_status: "inactive",
    subscription_interval: null,
    current_period_end: null,
    last_evaluation_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("operatorDisplayName", () => {
  it("falls back to normalized_email and never prints blank", () => {
    assert.equal(operatorDisplayName("Chris", "cdaukas@gmail.com"), "Chris");
    assert.equal(operatorDisplayName("  ", "pat@church.org"), "pat@church.org");
    assert.equal(operatorDisplayName(null, null), "unknown");
  });
});

describe("formatIntervalLabel", () => {
  it("prints interval unknown for null", () => {
    assert.equal(formatIntervalLabel(null), "interval unknown");
    assert.equal(formatIntervalLabel("year"), "year");
  });
});

describe("digestSubject", () => {
  it("uses the nothing-to-act-on line at zero", () => {
    assert.equal(digestSubject(0), "Sermon Coach weekly: nothing to act on");
    assert.equal(digestSubject(4), "Sermon Coach weekly: 4 need attention");
  });
});

describe("isNeverActivated", () => {
  it("includes confirmed 7-30 day zero-eval accounts and excludes unconfirmed, archive, and fresh", () => {
    const base = profile({ id: "n" });
    const confirmed = "2026-08-14T13:00:00.000Z";
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-08-14T13:00:00.000Z" },
        0,
        now,
        confirmed,
      ),
      true,
    );
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-08-14T13:00:00.000Z" },
        0,
        now,
        null,
      ),
      false,
    );
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-08-15T13:00:00.000Z" },
        0,
        now,
        confirmed,
      ),
      false,
    );
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-07-22T13:00:00.000Z" },
        0,
        now,
        confirmed,
      ),
      true,
    );
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-07-21T12:59:59.000Z" },
        0,
        now,
        confirmed,
      ),
      false,
    );
    assert.equal(
      isNeverActivated(
        { ...base, created_at: "2026-08-10T13:00:00.000Z" },
        1,
        now,
        confirmed,
      ),
      false,
    );
  });
});

describe("assembleOperatorDigest", () => {
  it("builds header counts and the four lists", () => {
    const digest = assembleOperatorDigest({
      now,
      profiles: [
        profile({
          id: "quiet",
          display_name: null,
          normalized_email: "quiet@church.org",
          subscription_status: "active",
          last_evaluation_at: "2026-07-20T00:00:00.000Z",
        }),
        profile({
          id: "fresh-pay",
          subscription_status: "active",
          last_evaluation_at: "2026-08-20T00:00:00.000Z",
        }),
        profile({
          id: "never",
          display_name: "New",
          created_at: "2026-08-10T13:00:00.000Z",
        }),
        profile({
          id: "never-bot",
          display_name: "Bot",
          created_at: "2026-08-10T13:00:00.000Z",
        }),
        profile({
          id: "archive",
          created_at: "2026-06-01T13:00:00.000Z",
        }),
        profile({
          id: "renew-year",
          display_name: "Annual",
          subscription_status: "active",
          subscription_interval: "year",
          current_period_end: "2026-08-28T13:00:00.000Z",
          last_evaluation_at: "2026-08-20T00:00:00.000Z",
        }),
        profile({
          id: "renew-null",
          display_name: "Gap",
          subscription_status: "active",
          subscription_interval: null,
          current_period_end: "2026-08-25T13:00:00.000Z",
          last_evaluation_at: "2026-08-20T00:00:00.000Z",
        }),
        profile({
          id: "monthly",
          subscription_status: "active",
          subscription_interval: "month",
          current_period_end: "2026-08-25T13:00:00.000Z",
          last_evaluation_at: "2026-08-20T00:00:00.000Z",
        }),
        profile({
          id: "new-account",
          created_at: "2026-08-20T13:00:00.000Z",
        }),
      ],
      evals: [
        { owner_id: "quiet", created_at: "2026-07-20T00:00:00.000Z" },
        { owner_id: "fresh-pay", created_at: "2026-08-20T00:00:00.000Z" },
        { owner_id: "fresh-pay", created_at: "2026-08-16T00:00:00.000Z" },
        { owner_id: "renew-year", created_at: "2026-08-20T00:00:00.000Z" },
        { owner_id: "renew-null", created_at: "2026-08-20T00:00:00.000Z" },
        { owner_id: "monthly", created_at: "2026-08-20T00:00:00.000Z" },
        { owner_id: "repeat", created_at: "2026-08-01T00:00:00.000Z" },
        { owner_id: "repeat", created_at: "2026-07-01T00:00:00.000Z" },
      ],
      grants: [
        {
          user_id: "quiet",
          quantity_remaining: 2,
          expires_at: "2026-09-15T00:00:00.000Z",
        },
        {
          user_id: "quiet",
          quantity_remaining: 1,
          expires_at: null,
        },
        {
          user_id: "quiet",
          quantity_remaining: 3,
          expires_at: "2026-12-01T00:00:00.000Z",
        },
      ],
      authUsers: [
        { id: "never", email_confirmed_at: "2026-08-10T14:00:00.000Z" },
        { id: "never-bot", email_confirmed_at: null },
        { id: "quiet", email_confirmed_at: "2026-07-01T00:00:00.000Z" },
      ],
    });

    assert.equal(digest.header.evaluationsLast7Days, 5);
    assert.equal(digest.header.evaluationsPrevious7Days, 0);
    assert.equal(digest.header.newAccountsLast7Days, 1);
    assert.equal(digest.header.accountsWithTwoOrMoreEvals, 2);
    assert.deepEqual(
      digest.lists.quietSubscribers.map((row) => row.name),
      ["quiet@church.org"],
    );
    assert.equal(digest.lists.quietSubscribers[0]!.eval_count, 1);
    assert.deepEqual(
      digest.lists.neverActivated.map((row) => row.name),
      ["New"],
    );
    assert.equal(digest.lists.neverActivated[0]!.confirmed, "2026-08-10");
    assert.equal(digest.lists.creditsAtRisk.length, 1);
    assert.equal(digest.lists.creditsAtRisk[0]!.quantity_remaining, 2);
    assert.deepEqual(
      digest.lists.renewals.map((row) => row.interval_label),
      ["interval unknown", "year"],
    );
    assert.equal(digest.attentionCount, 5);
  });

  it("renders empty lists as heading plus none, and truncates at 10", () => {
    const empty = assembleOperatorDigest({
      now,
      profiles: [],
      evals: [],
      grants: [],
      authUsers: [],
    });
    const emptyHtml = renderOperatorDigestHtml(empty);
    assert.match(emptyHtml, /<h2>Quiet subscribers<\/h2>\n<p>none<\/p>/);
    assert.match(
      emptyHtml,
      /<h2>Never activated \(confirmed accounts\)<\/h2>\n<p>none<\/p>/,
    );
    assert.match(emptyHtml, /<h2>Credits at risk<\/h2>\n<p>none<\/p>/);
    assert.match(emptyHtml, /<h2>Renewals, next 14 days<\/h2>\n<p>none<\/p>/);
    assert.equal(emptyHtml.includes("unsubscribe"), false);
    assert.equal(emptyHtml.includes("<img"), false);
    assert.equal(digestSubject(empty.attentionCount), "Sermon Coach weekly: nothing to act on");

    const many = assembleOperatorDigest({
      now,
      profiles: Array.from({ length: LIST_TRUNCATE + 3 }, (_, i) =>
        profile({
          id: `q${i}`,
          display_name: `Quiet ${i}`,
          created_at: "2026-06-01T13:00:00.000Z",
          subscription_status: "active",
          last_evaluation_at: "2026-07-01T00:00:00.000Z",
        }),
      ),
      evals: [],
      grants: [],
      authUsers: [],
    });
    const html = renderOperatorDigestHtml(many);
    assert.match(html, /\+3 more/);
    assert.equal((html.match(/<p>Quiet \d+ ·/g) ?? []).length, LIST_TRUNCATE);
  });
});
