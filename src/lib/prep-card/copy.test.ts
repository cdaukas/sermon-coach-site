import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPrepCountCaption,
  formatPrepDenominatorNote,
  prepBuiltFromSummary,
  prepCardPoolNote,
  prepInterpretationParagraph,
  prepStrengthsFloorNote,
  PREP_MEASURE_COPY,
  PREP_MEASURE_INTERPRETATION,
  PREP_THEME_QUESTION,
} from "./copy";
import { PREP_MEASURE_IDS } from "./measures";

describe("formatPrepCountCaption", () => {
  it("does not double the denominator on sermons", () => {
    assert.equal(formatPrepCountCaption(24, 24, 2), "24 of 24 sermons");
    assert.equal(formatPrepCountCaption(8, 24, 7), "8 of 24 sermons");
  });

  it("uses manuscripts phrasing for measures 4, 5, 6, and 11", () => {
    assert.equal(formatPrepCountCaption(6, 18, 4), "6 of your 18 manuscripts");
    assert.equal(formatPrepCountCaption(6, 18, 5), "6 of your 18 manuscripts");
    assert.equal(formatPrepCountCaption(1, 10, 6), "1 of your 10 manuscripts");
    assert.equal(formatPrepCountCaption(3, 10, 11), "3 of your 10 manuscripts");
  });

  it("uses Christ-mention phrasing for measure 1", () => {
    assert.equal(
      formatPrepCountCaption(12, 80, 1),
      "12 of 80 Christ mentions",
    );
  });
});

describe("prepBuiltFromSummary", () => {
  it("names sample, date, format split, and discipline count in one line", () => {
    assert.equal(
      prepBuiltFromSummary({
        rankedMeasureCount: 7,
        sampleSize: 24,
        manuscriptCount: 18,
        transcriptCount: 6,
        dateLabel: "5 September 2026",
      }),
      "Built from 24 sermons on 5 September 2026 — 18 manuscripts and 6 transcripts — across 7 measured disciplines.",
    );
  });
});

describe("formatPrepDenominatorNote", () => {
  it("names dropped transcripts at the point of use", () => {
    assert.equal(
      formatPrepDenominatorNote(18, 24, 6),
      "Six came in as transcripts and have no outline to read.",
    );
    assert.equal(
      formatPrepDenominatorNote(17, 18, 4),
      "One came in as a transcript and has no outline to read.",
    );
  });

  it("stays silent when the denominator matches the sample", () => {
    assert.equal(formatPrepDenominatorNote(24, 24, 6), null);
    assert.equal(formatPrepDenominatorNote(18, 24, 2), null);
  });
});

describe("PREP_THEME_QUESTION", () => {
  it("keeps the Christ theme question on the face", () => {
    assert.equal(
      PREP_THEME_QUESTION.christ,
      "Does Christ act in this sermon, or is he its destination?",
    );
  });
});

describe("christ theme growth asks", () => {
  it("keeps every live ask answerable against this week's manuscript", () => {
    assert.match(PREP_MEASURE_COPY[1].ask ?? "", /this week's text/);
    assert.match(PREP_MEASURE_COPY[6].ask ?? "", /Which point in this sermon/);
    assert.match(PREP_MEASURE_COPY[8].ask ?? "", /this passage/);
    assert.match(PREP_MEASURE_COPY[11].ask ?? "", /this sermon's argument/);
    assert.match(PREP_MEASURE_COPY[12].ask ?? "", /In this sermon/);
  });
});

describe("christ theme census claim", () => {
  it("carries the n on the outline-agency claim", () => {
    assert.match(
      PREP_MEASURE_INTERPRETATION[6].low ?? "",
      /4,227 numbered points in 497 sermons/,
    );
    assert.match(PREP_MEASURE_INTERPRETATION[6].low ?? "", /one in two hundred/);
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
  it("has high copy for every measure; low for actionable and Christ-theme live measures", () => {
    for (const id of PREP_MEASURE_IDS) {
      assert.ok(prepInterpretationParagraph(id, "high"));
      if (id <= 7 || id === 8 || id === 11 || id === 12) {
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
