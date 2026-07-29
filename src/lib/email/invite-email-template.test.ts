import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderInviteEmailHtml } from "./invite-email-template";
import { mentorInviteEmailFromHeader } from "./send-mentor-invite-email";

describe("invite email template", () => {
  it("renders invite copy and CTA without marketing footer", () => {
    const html = renderInviteEmailHtml({
      displayName: "Chris Daukas",
      token: "e4f36c55-385a-461a-9a51-ad635f6e657c",
    });

    assert.match(html, /Chris Daukas has invited you/);
    assert.match(html, /See the invitation/);
    assert.match(
      html,
      /https:\/\/www\.sermoncoach\.online\/invite\/e4f36c55-385a-461a-9a51-ad635f6e657c/,
    );
    assert.match(html, /A seat on The Sermon Coach, on him\./);
    assert.doesNotMatch(html, /Unsubscribe/);
    assert.doesNotMatch(html, /Run an evaluation/);
  });
});

describe("mentorInviteEmailFromHeader", () => {
  it("wraps display name in via The Sermon Coach", () => {
    assert.equal(
      mentorInviteEmailFromHeader("Chris"),
      '"Chris via The Sermon Coach" <chris@sermoncoach.online>',
    );
  });
});
