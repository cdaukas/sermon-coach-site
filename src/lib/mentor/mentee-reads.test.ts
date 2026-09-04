import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  darkInviteDebriefLine,
  enableDebriefConfirmBody,
  evaluationIsDarkForMentee,
  FALLBACK_MENTOR_NAME,
  menteeFacingMentorName,
  menteeHandoffSentences,
  menteeSubmitStandingLine,
  parseMenteeReads,
  sermonHidesUnevaluatedBand,
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

describe("menteeFacingMentorName", () => {
  it("returns your mentor for blank and the legacy fallback", () => {
    assert.equal(menteeFacingMentorName(""), FALLBACK_MENTOR_NAME);
    assert.equal(menteeFacingMentorName(null), FALLBACK_MENTOR_NAME);
    assert.equal(
      menteeFacingMentorName("a preacher you know"),
      FALLBACK_MENTOR_NAME,
    );
  });

  it("passes through a real display name", () => {
    assert.equal(menteeFacingMentorName("Chris Daukas"), "Chris Daukas");
  });
});

describe("handoff and invite copy", () => {
  it("returns the three handoff sentences with the mentor name", () => {
    assert.deepEqual(menteeHandoffSentences("Tyler James"), [
      "Sent to Tyler James.",
      "Tyler James will review it and reach out to you.",
      "It will not appear in your account.",
    ]);
  });

  it("returns the dark invite line verbatim", () => {
    assert.equal(
      darkInviteDebriefLine("Tyler James"),
      "Tyler James will read your sermons and talk with you about them. Everything comes through them.",
    );
  });
});

describe("menteeSubmitStandingLine", () => {
  it("renders Apprentice under cap with digits and repeated mentor name", () => {
    assert.equal(
      menteeSubmitStandingLine({
        mentorName: "Tyler James",
        seatType: "debrief",
        menteeReadsNone: false,
        used: 1,
        cap: 2,
      }),
      "This sermon goes to Tyler James. You will get the coaching debrief and How It Preaches. Tyler James decides when to release your score. 1 of 2 this month.",
    );
  });

  it("renders dark Apprentice under cap", () => {
    assert.equal(
      menteeSubmitStandingLine({
        mentorName: "Tyler James",
        seatType: "debrief",
        menteeReadsNone: true,
        used: 0,
        cap: 2,
      }),
      "This sermon goes to Tyler James. It will not appear in your account. Tyler James will review it and reach out to you. 0 of 2 this month.",
    );
  });

  it("renders Colleague under cap", () => {
    assert.equal(
      menteeSubmitStandingLine({
        mentorName: "Tyler James",
        seatType: "evaluation",
        menteeReadsNone: false,
        used: 3,
        cap: 4,
      }),
      "This sermon goes to Tyler James. You see everything, including the score, as soon as it is ready. 3 of 4 this month.",
    );
  });

  it("renders the at-cap wall for any seat type", () => {
    assert.equal(
      menteeSubmitStandingLine({
        mentorName: "Tyler James",
        seatType: "debrief",
        menteeReadsNone: false,
        used: 2,
        cap: 2,
      }),
      "2 of 2 sermons with Tyler James this month. You can submit again on the 1st.",
    );
  });

  it("capitalizes the your mentor fallback at sentence start only", () => {
    assert.equal(
      menteeSubmitStandingLine({
        mentorName: "your mentor",
        seatType: "debrief",
        menteeReadsNone: false,
        used: 1,
        cap: 2,
      }),
      "This sermon goes to your mentor. You will get the coaching debrief and How It Preaches. Your mentor decides when to release your score. 1 of 2 this month.",
    );
  });
});

describe("evaluationIsDarkForMentee", () => {
  const stamp = "2026-08-28T18:00:00.000Z";
  const before = "2026-08-28T17:59:59.000Z";
  const after = "2026-08-28T18:00:01.000Z";

  it("hides every evaluation while the relationship is still none", () => {
    assert.equal(evaluationIsDarkForMentee("none", null, after), true);
    assert.equal(evaluationIsDarkForMentee("none", stamp, after), true);
  });

  it("shows every evaluation on a never-dark relationship", () => {
    assert.equal(evaluationIsDarkForMentee("debrief", null, before), false);
  });

  it("hides evaluations created before the stamp after a flip", () => {
    assert.equal(evaluationIsDarkForMentee("debrief", stamp, before), true);
    assert.equal(evaluationIsDarkForMentee("debrief", stamp, stamp), false);
    assert.equal(evaluationIsDarkForMentee("debrief", stamp, after), false);
  });
});

describe("sermonHidesUnevaluatedBand", () => {
  const stamp = "2026-08-28T18:00:00.000Z";

  it("hides the band while still dark", () => {
    assert.equal(sermonHidesUnevaluatedBand(true, null, stamp), true);
  });

  it("hides pre-stamp sermons after a flip", () => {
    assert.equal(
      sermonHidesUnevaluatedBand(false, stamp, "2026-08-28T17:00:00.000Z"),
      true,
    );
    assert.equal(
      sermonHidesUnevaluatedBand(false, stamp, "2026-08-28T19:00:00.000Z"),
      false,
    );
  });
});

describe("enableDebriefConfirmBody", () => {
  it("keeps the confirm copy and substitutes only the name", () => {
    assert.equal(
      enableDebriefConfirmBody("Tara"),
      "Tara will start seeing the coaching debrief and How It Preaches for sermons submitted from now on. Anything already submitted stays with you. Worth saying something before it turns up.",
    );
  });
});
