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

    const d = normalizePassageRef("Heb 3");
    assert.equal(d.ok, true);
    if (d.ok) assert.equal(d.normalized, "Hebrews 3");
  });

  it("strips parenthetical notes", () => {
    const r = normalizePassageRef("Psalm 31 (Greg Cox)");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.normalized, "Psalm 31");
  });

  it("accepts cross-chapter ranges (real preaching units)", () => {
    const a = normalizePassageRef("1 Corinthians 10:31-11:1");
    assert.equal(a.ok, true);
    if (a.ok) assert.equal(a.normalized, "1 Corinthians 10:31-11:1");

    const b = normalizePassageRef("Luke 10:38-11:13");
    assert.equal(b.ok, true);
    if (b.ok) assert.equal(b.normalized, "Luke 10:38-11:13");

    // Round-trip / key collision: em-dash and abbreviation
    const c = normalizePassageRef("1 Cor 10:31—11:1");
    assert.equal(c.ok, true);
    if (c.ok) assert.equal(c.normalized, "1 Corinthians 10:31-11:1");
  });

  it("rejects multi-passages and inverted ranges", () => {
    assert.equal(
      normalizePassageRef(
        "Matthew 5:1-4; Ecclesiastes 7:1b-2; Psalm 90:10,12",
      ).ok,
      false,
    );
    assert.equal(normalizePassageRef("Luke 11:13-10:38").ok, false);
  });

  it("rejects garbage, unknown books, and book-only refs", () => {
    const email = normalizePassageRef("jon.moorhead@gracechurchaz.org");
    assert.equal(email.ok, false);

    const nonEnglish = normalizePassageRef("Giudici 6:1-24");
    assert.equal(nonEnglish.ok, false);
    if (!nonEnglish.ok) assert.match(nonEnglish.reason, /unknown book/i);

    const bookOnly = normalizePassageRef("Ecclesiastes");
    assert.equal(bookOnly.ok, false);
    if (!bookOnly.ok) assert.equal(bookOnly.reason, "book without chapter");

    // Trailing free text is not a parenthetical — still unparseable
    assert.equal(normalizePassageRef("Psalm 30 Greg Cox").ok, false);
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

  it("canonicalizes single-chapter book verse ranges", () => {
    for (const raw of ["2 John 1–13", "2 John 1-13", "2 Jn 1:1-13"]) {
      const r = normalizePassageRef(raw);
      assert.equal(r.ok, true, raw);
      if (r.ok) assert.equal(r.normalized, "2 John 1:1-13", raw);
    }

    const jude = normalizePassageRef("Jude 1-25");
    assert.equal(jude.ok, true);
    if (jude.ok) assert.equal(jude.normalized, "Jude 1:1-25");

    const phm = normalizePassageRef("Philemon 1-16");
    assert.equal(phm.ok, true);
    if (phm.ok) assert.equal(phm.normalized, "Philemon 1:1-16");
  });

  it("does not invent verse ranges for whole-chapter refs", () => {
    assert.deepEqual(normalizePassageRef("Hebrews 3"), {
      ok: true,
      normalized: "Hebrews 3",
    });
    assert.deepEqual(normalizePassageRef("Jonah 4"), {
      ok: true,
      normalized: "Jonah 4",
    });
    assert.deepEqual(normalizePassageRef("Judges 7"), {
      ok: true,
      normalized: "Judges 7",
    });
  });
});
