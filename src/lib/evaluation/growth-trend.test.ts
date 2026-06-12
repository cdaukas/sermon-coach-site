import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toDisplayScore } from "./display-score";
import { getDisplayBandZones, toGrowthTrendPoints } from "./growth-trend";
import { deriveBandFromWeighted } from "./schema";

describe("growth trend band zones", () => {
  it("derives display boundaries from deriveBandFromWeighted floors", () => {
    const zones = getDisplayBandZones();

    assert.equal(zones[0].band, "Exemplary");
    assert.equal(zones[0].minDisplay, toDisplayScore(47));
    assert.equal(zones[0].maxDisplay, 10);

    assert.equal(zones[1].band, "Strong");
    assert.equal(zones[1].minDisplay, toDisplayScore(39));
    assert.equal(zones[1].maxDisplay, toDisplayScore(47));

    assert.equal(zones[4].band, "Significant Concerns");
    assert.equal(zones[4].minDisplay, toDisplayScore(0));
    assert.equal(zones[4].maxDisplay, toDisplayScore(22));
  });

  it("aligns each zone floor with the canonical band at that weighted score", () => {
    for (const zone of getDisplayBandZones()) {
      const weightedAtFloor = Math.round(zone.minDisplay * 5.5);
      assert.equal(deriveBandFromWeighted(weightedAtFloor), zone.band);
    }
  });
});

describe("toGrowthTrendPoints", () => {
  it("maps overall_score through display-score helpers", () => {
    const [point] = toGrowthTrendPoints([
      {
        id: "eval-1",
        overall_score: 37,
        score_band: "Faithful · Tier 3",
        completed_at: "2026-06-01T12:00:00.000Z",
      },
    ]);

    assert.equal(point.displayScore, 6.7);
    assert.equal(point.displayScoreLabel, "6.7");
    assert.equal(point.submissionOrder, 1);
    assert.match(point.completedAtLabel, /2026/);
  });
});
