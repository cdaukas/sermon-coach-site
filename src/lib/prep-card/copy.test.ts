import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepCardPoolNote } from "./copy";

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
