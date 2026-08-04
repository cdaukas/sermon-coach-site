import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePassageRef } from "./normalize";

describe("normalizePassageRef", () => {
  it("canonicalizes Hebrews variants to one key", () => {
    const expected = "Hebrews 3:1-6";
    for (const raw of [
      "Hebrews 3:1-6",
      "Heb 3:1-6",
      "heb. 3:1-6",
      "Hebrews 3.1–6",
      "Hebrews 3.1-6",
      "  Hebrews  3:1–6  ",
    ]) {
      const r = normalizePassageRef(raw);
      assert.equal(r.ok, true, raw);
      if (r.ok) assert.equal(r.normalized, expected, raw);
    }
  });

  it("handles numbered books and chapter-only", () => {
    const a = normalizePassageRef("1 Cor 10:1-12");
    assert.equal(a.ok, true);
    if (a.ok) assert.equal(a.normalized, "1 Corinthians 10:1-12");

    const b = normalizePassageRef("2 Samuel 9");
    assert.equal(b.ok, true);
    if (b.ok) assert.equal(b.normalized, "2 Samuel 9");

    const c = normalizePassageRef("Psalm 127");
    assert.equal(c.ok, true);
    if (c.ok) assert.equal(c.normalized, "Psalm 127");
  });

  it("strips parenthetical notes", () => {
    const r = normalizePassageRef("Psalm 31 (Greg Cox)");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.normalized, "Psalm 31");
  });

  it("rejects cross-chapter ranges and multi-passages", () => {
    assert.equal(normalizePassageRef("Luke 10:38-11:13").ok, false);
    assert.equal(
      normalizePassageRef(
        "Matthew 5:1-4; Ecclesiastes 7:1b-2; Psalm 90:10,12",
      ).ok,
      false,
    );
  });

  it("rejects garbage and unknown books", () => {
    assert.equal(
      normalizePassageRef("jon.moorhead@gracechurchaz.org").ok,
      false,
    );
    assert.equal(normalizePassageRef("Giudici 6:1-24").ok, false);
    assert.equal(normalizePassageRef("").ok, false);
  });

  it("accepts common typos present in live data", () => {
    const a = normalizePassageRef("Philipians 1:12-18");
    assert.equal(a.ok, true);
    if (a.ok) assert.equal(a.normalized, "Philippians 1:12-18");

    const b = normalizePassageRef("Epheisans 6:10-24");
    assert.equal(b.ok, true);
    if (b.ok) assert.equal(b.normalized, "Ephesians 6:10-24");
  });
});
