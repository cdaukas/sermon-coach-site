import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  darkInviteDebriefLine,
  menteeHandoffSentences,
  parseMenteeReads,
} from "./mentee-reads";

describe("parseMenteeReads", () => {
  it("treats null and debrief as the mentee reading the debrief", () => {
    assert.equal(parseMenteeReads(null), "debrief");
    assert.equal(parseMenteeReads("debrief"), "debrief");
    assert.equal(parseMenteeReads(undefined), "debrief");
  });

  it("treats none as the dark option", () => {
    assert.equal(parseMenteeReads("none"), "none");
  });
});

describe("handoff and invite copy", () => {
  it("returns the two handoff sentences with the mentor name", () => {
    assert.deepEqual(menteeHandoffSentences("Tyler James"), [
      "Your sermon went to Tyler James.",
      "He'll set up a time to talk with you about it.",
    ]);
  });

  it("returns the dark invite line verbatim", () => {
    assert.equal(
      darkInviteDebriefLine("Tyler James"),
      "Tyler James will read your sermons and talk with you about them. Everything comes through him.",
    );
  });
});
