import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";
import {
  signTuesdayNudgeUnsubscribeToken,
  verifyTuesdayNudgeUnsubscribeToken,
} from "./tuesday-nudge-unsubscribe";
import {
  classifyTuesdayNudgeRecipient,
  isEmptyInactiveAccount,
  startOfUtcIsoWeek,
  type TuesdayNudgeCandidate,
} from "./tuesday-nudge-recipients";
import {
  renderTuesdayNudgeHtml,
  tuesdayNudgeFirstName,
  TUESDAY_NUDGE_SUBJECT,
} from "./tuesday-nudge-template";

function candidate(
  overrides: Partial<TuesdayNudgeCandidate> = {},
): TuesdayNudgeCandidate {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "pastor@example.com",
    displayName: "Jordan Wells",
    createdAt: "2026-07-01T00:00:00.000Z",
    lastSignInAt: "2026-08-20T00:00:00.000Z",
    lastEvaluationAt: "2026-08-20T00:00:00.000Z",
    lastSentAt: null,
    sermonCount: 2,
    evaluationCount: 2,
    recentCompleteEvalAt: null,
    ...overrides,
  };
}

describe("tuesday nudge unsubscribe tokens", () => {
  it("round-trips and is not interchangeable with the blog token", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
    const email = "Pastor@Example.com";
    const tuesday = signTuesdayNudgeUnsubscribeToken(email);
    const blog = signUnsubscribeToken(email);

    assert.equal(verifyTuesdayNudgeUnsubscribeToken(tuesday), "pastor@example.com");
    assert.equal(verifyUnsubscribeToken(blog), "pastor@example.com");
    assert.equal(verifyTuesdayNudgeUnsubscribeToken(blog), null);
    assert.equal(verifyUnsubscribeToken(tuesday), null);
  });
});

describe("tuesday nudge template", () => {
  it("uses the locked copy with name substitution only", () => {
    const html = renderTuesdayNudgeHtml({
      firstName: "Jordan",
      dashboardUrl: "https://sermoncoach.com/dashboard",
      unsubscribeUrl: "https://sermoncoach.com/unsubscribe/tuesday-nudge?token=abc",
    });

    assert.equal(TUESDAY_NUDGE_SUBJECT, "Your Tuesday reminder");
    assert.match(html, /Hi Jordan,/);
    assert.match(html, /You asked for a nudge on Tuesdays, so here it is/);
    assert.match(html, /https:\/\/sermoncoach\.com\/dashboard/);
    assert.match(html, /unsubscribe\/tuesday-nudge/);
    assert.match(html, />Chris<\/p>/);
    assert.doesNotMatch(html, /!/);
    assert.doesNotMatch(html, /\u2014/);
    assert.equal(tuesdayNudgeFirstName("Chris Daukas"), "Chris");
    assert.equal(tuesdayNudgeFirstName(null), null);
  });

  it("omits the greeting line when there is no first name", () => {
    const html = renderTuesdayNudgeHtml({
      firstName: null,
      dashboardUrl: "https://sermoncoach.com/dashboard",
      unsubscribeUrl: "https://sermoncoach.com/unsubscribe/tuesday-nudge?token=abc",
    });
    assert.doesNotMatch(html, /Hi /);
    assert.match(html, /^<p>You asked for a nudge on Tuesdays/);
  });
});

describe("tuesday nudge recipient classification", () => {
  const now = new Date("2026-09-08T13:00:00.000Z");

  it("sends a qualifying opted-in preacher", () => {
    const decision = classifyTuesdayNudgeRecipient(candidate(), now);
    assert.deepEqual(decision, { action: "send", firstName: "Jordan" });
  });

  it("hardcode-excludes notifications@korper.nl", () => {
    const decision = classifyTuesdayNudgeRecipient(
      candidate({ email: "notifications@korper.nl" }),
      now,
    );
    assert.deepEqual(decision, { action: "skip", reason: "excluded" });
  });

  it("skips accounts younger than 7 days", () => {
    const decision = classifyTuesdayNudgeRecipient(
      candidate({ createdAt: "2026-09-02T13:07:00.000Z" }),
      now,
    );
    assert.deepEqual(decision, { action: "skip", reason: "younger_than_7_days" });
  });

  it("skips a complete evaluation in the last 3 days", () => {
    const decision = classifyTuesdayNudgeRecipient(
      candidate({ recentCompleteEvalAt: "2026-09-06T12:00:00.000Z" }),
      now,
    );
    assert.deepEqual(decision, { action: "skip", reason: "eval_within_3_days" });
  });

  it("skips a same UTC ISO week prior send", () => {
    const weekStart = startOfUtcIsoWeek(now);
    const decision = classifyTuesdayNudgeRecipient(
      candidate({ lastSentAt: weekStart.toISOString() }),
      now,
    );
    assert.deepEqual(decision, { action: "skip", reason: "already_sent_this_week" });
  });

  it("sends again after the previous UTC ISO week", () => {
    const decision = classifyTuesdayNudgeRecipient(
      candidate({ lastSentAt: "2026-09-01T13:00:00.000Z" }),
      now,
    );
    assert.deepEqual(decision, { action: "send", firstName: "Jordan" });
  });

  it("skips empty inactive accounts and keeps Chris's test account", () => {
    const empty = candidate({
      email: "empty@example.com",
      sermonCount: 0,
      evaluationCount: 0,
      lastEvaluationAt: null,
      recentCompleteEvalAt: null,
      lastSignInAt: "2026-08-01T00:00:00.000Z",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    assert.equal(isEmptyInactiveAccount(empty, now.getTime()), true);
    assert.deepEqual(classifyTuesdayNudgeRecipient(empty, now), {
      action: "skip",
      reason: "empty_inactive",
    });

    const testAccount = candidate({
      email: "cdaukas+sketchtest@gmail.com",
      displayName: null,
      sermonCount: 0,
      evaluationCount: 0,
      lastEvaluationAt: null,
      recentCompleteEvalAt: null,
      lastSignInAt: null,
      createdAt: "2026-08-13T04:38:10.307Z",
    });
    assert.equal(isEmptyInactiveAccount(testAccount, now.getTime()), true);
    assert.deepEqual(classifyTuesdayNudgeRecipient(testAccount, now), {
      action: "send",
      firstName: null,
    });
  });
});
