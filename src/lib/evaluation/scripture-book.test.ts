import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveBookFromPassage } from "./scripture-book";

describe("deriveBookFromPassage", () => {
  it("derives the book from common full-name references", () => {
    assert.equal(deriveBookFromPassage("Philippians 4:10-13"), "Philippians");
    assert.equal(deriveBookFromPassage("Hebrews 12:5-17"), "Hebrews");
    assert.equal(deriveBookFromPassage("2 Corinthians 11:16–33"), "2 Corinthians");
    assert.equal(deriveBookFromPassage("1 Samuel 17"), "1 Samuel");
    assert.equal(deriveBookFromPassage("Psalm 23"), "Psalms");
    assert.equal(deriveBookFromPassage("Song of Songs 2:1"), "Song of Songs");
    assert.equal(deriveBookFromPassage("Revelation 4–5"), "Revelation");
  });

  it("accepts common abbreviations and compacted chapter numbers", () => {
    assert.equal(deriveBookFromPassage("Phil 4:11-13"), "Philippians");
    assert.equal(deriveBookFromPassage("1 Cor 13"), "1 Corinthians");
    assert.equal(deriveBookFromPassage("2 Kgs 5:1-14"), "2 Kings");
    assert.equal(deriveBookFromPassage("Jn 3:16"), "John");
    assert.equal(deriveBookFromPassage("philippians4:10"), "Philippians");
  });

  it("does not invent a book from a series title or empty input", () => {
    assert.equal(deriveBookFromPassage("Living Sent, week 4"), null);
    assert.equal(deriveBookFromPassage("   "), null);
    assert.equal(deriveBookFromPassage(null), null);
    assert.equal(deriveBookFromPassage(undefined), null);
  });

  it("does not confuse John with 1 John", () => {
    assert.equal(deriveBookFromPassage("John 15:1-11"), "John");
    assert.equal(deriveBookFromPassage("1 John 4:7-21"), "1 John");
    assert.equal(deriveBookFromPassage("3 John 1-8"), "3 John");
  });
});
