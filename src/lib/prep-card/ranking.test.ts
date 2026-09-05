import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankPrepCard } from "./ranking";
import type { PrepMeasureCount } from "./types";

function count(
  id: PrepMeasureCount["id"],
  hits: number,
  eligible: number,
): PrepMeasureCount {
  return { id, hits, eligible, rate: hits / eligible };
}

describe("rankPrepCard", () => {
  it("takes top strengths and bottom focus from six actionable, with no overlap", () => {
    const counts: PrepMeasureCount[] = [
      count(2, 15, 17),
      count(3, 4, 17),
      count(4, 10, 17),
      count(5, 8, 12),
      count(7, 2, 17),
      count(12, 3, 17),
    ];
    const { strengths, focus } = rankPrepCard(counts, { sampleSize: 17 });
    assert.equal(strengths.length, 3);
    assert.deepEqual(
      strengths.map((row) => row.id),
      [2, 5, 4],
    );
    assert.equal(focus.length, 3);
    assert.deepEqual(
      focus.map((row) => row.id),
      [7, 12, 3],
    );
  });

  it("breaks rate ties by measure table order (lower id wins)", () => {
    const counts: PrepMeasureCount[] = [
      count(2, 5, 10),
      count(3, 5, 10),
      count(4, 1, 10),
      count(7, 1, 10),
    ];
    const { strengths, focus } = rankPrepCard(counts, { sampleSize: 12 });
    assert.equal(strengths[0]?.id, 2);
    assert.equal(strengths[1]?.id, 3);
    // Lowest rates are 4 and 7 at 0.1; tiebreak prefers 4 then 7.
    // Top 3 strengths: 2, 3, and next is 4 (tie with 7, lower id).
    // Focus after removing strengths: 7 only.
    assert.ok(strengths.some((row) => row.id === 4));
    assert.deepEqual(
      focus.map((row) => row.id),
      [7],
    );
  });

  it("ignores null rates (stubs and uncomputed)", () => {
    const counts: PrepMeasureCount[] = [
      count(2, 8, 10),
      count(3, 3, 10),
      count(4, 6, 10),
      { id: 6, hits: null, eligible: null, rate: null },
      count(7, 1, 10),
      { id: 1, hits: null, eligible: null, rate: null },
      count(12, 2, 10),
    ];
    const { strengths, focus } = rankPrepCard(counts, { sampleSize: 12 });
    assert.ok(!strengths.some((row) => row.id === 6 || row.id === 1));
    assert.ok(!focus.some((row) => row.id === 6 || row.id === 1));
    assert.ok(focus.some((row) => row.id === 7));
  });

  it("names fewer than three when the sample is thin", () => {
    const counts: PrepMeasureCount[] = [
      count(2, 2, 4),
      count(3, 1, 4),
      count(4, 3, 4),
      count(7, 0, 4),
    ];
    const { strengths, focus } = rankPrepCard(counts, { sampleSize: 4 });
    assert.ok(strengths.length <= 2);
    assert.ok(focus.length <= 2);
    const strengthIds = new Set(strengths.map((row) => row.id));
    for (const row of focus) {
      assert.equal(strengthIds.has(row.id), false);
    }
  });
});
