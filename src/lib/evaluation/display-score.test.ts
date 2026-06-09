import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDisplayScoreBare,
  formatDisplayScoreWithDenom,
  toDisplayScore,
} from "./display-score";
import { deriveBandFromWeighted } from "./schema";

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
