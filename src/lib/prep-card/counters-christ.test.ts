import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  measureGospelInSkeleton,
  measureGospelInSkeletonMatch,
} from "./counters-christ";
import {
  bookFromPrimaryPassage,
  genreForPassage,
  prepGenreCaveat,
} from "./genre";

describe("measureGospelInSkeleton (C4)", () => {
  it("hits when a numbered point carries a gospel word", () => {
    const body = [
      "1. Trust God in the waiting season",
      "2. Freedom Christ bought, not freedom you earned",
      "3. Praise God in the morning light",
      "",
      "Closing prose continues with full sentences that end cleanly.",
    ].join("\n");
    assert.equal(measureGospelInSkeleton(body), true);
    assert.match(
      measureGospelInSkeletonMatch(body) ?? "",
      /Freedom Christ bought/,
    );
  });

  it("misses when points have no gospel word", () => {
    const body = [
      "1. Trust God in the waiting season",
      "2. Obey God in the darkest night",
      "3. Praise God in the morning light",
    ].join("\n");
    assert.equal(measureGospelInSkeleton(body), false);
  });

  it("ignores template slot labels when matching gospel points", () => {
    const body = [
      "ME / INTRO",
      "1. ME / INTRO",
      "2. Living in freedom this week",
      "3. Grace Christ bought for every sinner",
    ].join("\n");
    assert.equal(measureGospelInSkeleton(body), true);
    assert.match(
      measureGospelInSkeletonMatch(body) ?? "",
      /Grace Christ bought/,
    );
  });

  it("returns null on transcript-shaped text without outline markers", () => {
    // detectPrepSourceFormat may still call this manuscript if no intake —
    // force transcript via intakePath convention if supported.
    const body = "So then we talked about grace for twenty minutes without points.";
    const result = measureGospelInSkeleton(body, "youtube");
    assert.equal(result, null);
  });
});

describe("genre from primary_passage", () => {
  it("maps books to genres", () => {
    assert.equal(bookFromPrimaryPassage("Ecclesiastes 3:1-8"), "ecclesiastes");
    assert.equal(genreForPassage("Ecclesiastes 3:1-8"), "wisdom");
    assert.equal(bookFromPrimaryPassage("1 Corinthians 13"), "1 corinthians");
    assert.equal(genreForPassage("Romans 8:1-4"), "epistle");
    assert.equal(genreForPassage("Acts 2:1-4"), "acts");
    assert.equal(genreForPassage("Matthew 5:1-12"), "gospel_narrative");
  });

  it("prints a caveat without adjusting counts", () => {
    const note = prepGenreCaveat({
      passages: [
        "Ecclesiastes 1:1",
        "Psalm 23",
        "Ecclesiastes 3:1",
        "Proverbs 3:5",
      ],
      sampleSize: 4,
    });
    assert.ok(note);
    assert.match(note!, /wisdom/i);
    assert.match(note!, /text, not you/);
    assert.doesNotMatch(note!, /adjusted|normalized|correct/i);
  });
});
