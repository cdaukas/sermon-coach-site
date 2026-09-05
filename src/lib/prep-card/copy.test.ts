import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPrepCountCaption,
  prepCardPoolNote,
  prepInterpretationParagraph,
  prepStrengthsFloorNote,
  PREP_MEASURE_INTERPRETATION,
} from "./copy";
import { PREP_MEASURE_IDS } from "./measures";

describe("formatPrepCountCaption", () => {
  it("does not double the denominator on sermons", () => {
    assert.equal(formatPrepCountCaption(24, 24, 2), "24 of 24 sermons");
    assert.equal(formatPrepCountCaption(8, 24, 7), "8 of 24 sermons");
  });

  it("uses manuscripts phrasing for measures 4 and 5", () => {
    assert.equal(formatPrepCountCaption(6, 18, 4), "6 of your 18 manuscripts");
    assert.equal(formatPrepCountCaption(6, 18, 5), "6 of your 18 manuscripts");
  });
});

describe("prepStrengthsFloorNote", () => {
  it("explains when the floor truncates below target", () => {
    assert.match(
      prepStrengthsFloorNote({ shown: 2, target: 3, clearedFloor: 2 }) ?? "",
      /50%/,
    );
    assert.equal(
      prepStrengthsFloorNote({ shown: 3, target: 3, clearedFloor: 5 }),
      null,
    );
  });
});

describe("prepInterpretationParagraph", () => {
  it("has high copy for every measure and low only for 1–7", () => {
    for (const id of PREP_MEASURE_IDS) {
      assert.ok(prepInterpretationParagraph(id, "high"));
      if (id <= 7) {
        assert.ok(prepInterpretationParagraph(id, "low"));
      } else {
        assert.equal(PREP_MEASURE_INTERPRETATION[id].low, null);
        assert.equal(prepInterpretationParagraph(id, "low"), null);
      }
    }
  });
});

describe("prepCardPoolNote", () => {
  it("names the format split and per-measure support on a mixed sample", () => {
    const note = prepCardPoolNote({
      sampleSize: 12,
      manuscriptCount: 6,
      transcriptCount: 6,
      actionableRankedCount: 5,
      ranked: [
        { id: 2, eligible: 12 },
        { id: 3, eligible: 12 },
        { id: 4, eligible: 6 },
        { id: 5, eligible: 6 },
        { id: 7, eligible: 12 },
        { id: 9, eligible: 12 },
        { id: 12, eligible: 12 },
      ],
    });
    assert.match(note, /6 manuscripts, 6 transcripts/);
    assert.match(note, /conclusion finish \(6 manuscripts\)/);
    assert.match(note, /frame-break \(6 manuscripts\)/);
    assert.match(note, /Focus is drawn from the 5 actionable/);
    assert.match(note, /manuscripts only/);
    assert.match(note, /not the full twelve/);
  });

  it("says transcript-only samples drop measures 4 and 5", () => {
    const note = prepCardPoolNote({
      sampleSize: 10,
      manuscriptCount: 0,
      transcriptCount: 10,
      actionableRankedCount: 3,
      ranked: [
        { id: 2, eligible: 10 },
        { id: 3, eligible: 10 },
        { id: 7, eligible: 10 },
        { id: 9, eligible: 10 },
        { id: 12, eligible: 10 },
      ],
    });
    assert.match(note, /all transcripts/);
    assert.match(note, /apply to transcripts/);
    assert.match(note, /Conclusion finish and frame-break need manuscripts/);
    assert.doesNotMatch(note, /conclusion finish \(/);
  });
});
