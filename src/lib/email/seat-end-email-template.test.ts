import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  menteeGreetingFromDisplayName,
  menteeIsActiveCoach,
  mentorNameFromDisplayName,
  renderSeatEndEmailHtml,
  seatEndEmailSubject,
} from "./seat-end-email-template";
import { SEAT_END_EMAIL_FROM } from "./constants";

describe("seat-end email copy", () => {
  it("uses first name or Hi there, and a mentor display name fallback", () => {
    assert.equal(menteeGreetingFromDisplayName("James Brown"), "James");
    assert.equal(menteeGreetingFromDisplayName("  "), "Hi there");
    assert.equal(menteeGreetingFromDisplayName(null), "Hi there");
    assert.equal(mentorNameFromDisplayName("Chris Daukas"), "Chris Daukas");
    assert.equal(mentorNameFromDisplayName(""), "your mentor");
  });

  it("builds a sentence-case subject", () => {
    assert.equal(
      seatEndEmailSubject("Chris Daukas"),
      "Your seat with Chris Daukas has ended",
    );
  });

  it("omits the Coach pitch only for an active Coach subscriber", () => {
    assert.equal(menteeIsActiveCoach("active", "coach"), true);
    assert.equal(menteeIsActiveCoach("inactive", "coach"), false);
    assert.equal(menteeIsActiveCoach("active", "free"), false);
  });

  it("renders the path-neutral body, Keep going link, and Chris signature", () => {
    const html = renderSeatEndEmailHtml({
      menteeGreeting: "James",
      mentorName: "Chris Daukas",
      includeCoachPitch: true,
    });

    assert.match(html, /James,/);
    assert.match(
      html,
      /Your mentoring seat with Chris Daukas has ended\. Everything he released to you is still in your library, and your account stays open\./,
    );
    assert.match(
      html,
      /If you want to keep going, a Coach plan is \$29 a month and gives you ten evaluations, your own growth reporting, and the Sketch before you write\./,
    );
    assert.match(html, /https:\/\/sermoncoach\.com\/dashboard\/buy/);
    assert.match(html, />Keep going</);
    assert.match(html, /Christopher M\. Daukas/);
    assert.match(html, /The Sermon Coach/);
    assert.doesNotMatch(html, /on us/);
    assert.doesNotMatch(html, /—|&mdash;|–/);
    assert.doesNotMatch(html, /Unsubscribe/);
  });

  it("omits the pitch paragraph for an active Coach mentee", () => {
    const html = renderSeatEndEmailHtml({
      menteeGreeting: "Hi there",
      mentorName: "Chris Daukas",
      includeCoachPitch: false,
    });

    assert.match(html, /Hi there,/);
    assert.match(html, /Everything he released to you is still in your library/);
    assert.doesNotMatch(html, /\$29/);
    assert.match(html, /https:\/\/sermoncoach\.com\/dashboard\/buy/);
  });

  it("sends from the sermoncoach mailbox", () => {
    assert.equal(
      SEAT_END_EMAIL_FROM,
      "Christopher M. Daukas <sermoncoach@sermoncoach.online>",
    );
  });
});
