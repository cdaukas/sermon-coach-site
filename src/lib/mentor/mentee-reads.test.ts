import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  darkInviteDebriefLine,
  enableDebriefConfirmBody,
  evaluationIsDarkForMentee,
  menteeHandoffSentences,
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

describe("handoff and invite copy", () => {
  it("returns the two handoff sentences with the mentor name", () => {
    assert.deepEqual(menteeHandoffSentences("Tyler James"), [
      "Your sermon went to Tyler James.",
      "You'll hear from them about it.",
    ]);
  });

  it("returns the dark invite line verbatim", () => {
    assert.equal(
      darkInviteDebriefLine("Tyler James"),
      "Tyler James will read your sermons and talk with you about them. Everything comes through them.",
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
