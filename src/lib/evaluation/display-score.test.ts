import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDisplayScoreBare,
  formatDisplayScoreWithDenom,
  formatStoredScoreBandForDisplay,
  parseEvaluationCardLabels,
  toDisplayScore,
} from "./display-score";
import { deriveBandFromWeighted, formatScoreBandStrict } from "./schema";

describe("display score conversion", () => {
  it("converts band-edge weighted scores to base-10 display values", () => {
    assert.equal(toDisplayScore(47), 8.5);
    assert.equal(toDisplayScore(39), 7.1);
    assert.equal(toDisplayScore(30), 5.5);
    assert.equal(toDisplayScore(37), 6.7);
  });

  it("formats bare and denom display strings", () => {
    assert.equal(formatDisplayScoreBare(37), "6.7");
    assert.equal(formatDisplayScoreWithDenom(37), "6.7 / 10");
  });

  it("derives bands from internal /55 scores, not display values", () => {
    assert.equal(deriveBandFromWeighted(37), "Faithful");
    assert.equal(deriveBandFromWeighted(toDisplayScore(37)), "Significant Concerns");
  });
});

describe("score band display cleanup", () => {
  it("writes band name only (no tier suffix)", () => {
    assert.equal(
      formatScoreBandStrict({
        composite_simple: 47,
        composite_weighted: 47,
        band: "Exemplary",
        raw_total: 47,
        raw_max: 55,
      }),
      "Exemplary",
    );
  });

  it("strips historical Tier and legacy letter on read", () => {
    assert.equal(
      formatStoredScoreBandForDisplay("Exemplary · Tier 5", 47),
      "Exemplary",
    );
    assert.equal(
      formatStoredScoreBandForDisplay("Strong · Tier 4", 43),
      "Strong",
    );
    assert.equal(
      formatStoredScoreBandForDisplay("C · Faithful", 35),
      "Faithful",
    );
  });

  it("never surfaces tierLabel for cards", () => {
    const parsed = parseEvaluationCardLabels("Exemplary · Tier 5", 47);
    assert.equal(parsed.bandLabel, "Exemplary");
    assert.equal(parsed.tierLabel, null);
  });
});
