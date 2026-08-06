import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mentoredMonthlySubmissionLimit } from "./allotment";

describe("mentoredMonthlySubmissionLimit", () => {
  it("caps Apprentice (debrief) at 2 and Colleague (evaluation) at 4", () => {
    assert.equal(mentoredMonthlySubmissionLimit("debrief"), 2);
    assert.equal(mentoredMonthlySubmissionLimit("evaluation"), 4);
  });
});
