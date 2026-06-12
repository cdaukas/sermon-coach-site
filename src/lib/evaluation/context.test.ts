import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContextPreamble,
  normalizeSermonContext,
  sermonContextStorageKey,
} from "./context";
import { buildUserMessage } from "./prompt";

describe("sermon context", () => {
  it("normalizes whitespace and omits empty fields", () => {
    assert.deepEqual(
      normalizeSermonContext({
        occasion: "  Sunday morning  ",
        audience: "",
        series: "   ",
        other: "Guest preacher",
      }),
      {
        occasion: "Sunday morning",
        other: "Guest preacher",
      },
    );
  });

  it("returns undefined when all fields are empty", () => {
    assert.equal(
      normalizeSermonContext({
        occasion: " ",
        audience: "",
      }),
      undefined,
    );
  });

  it("builds preamble with only provided fields", () => {
    const preamble = buildContextPreamble({
      occasion: "Funeral homily",
      series: "Week 3 of Romans",
    });

    assert.match(preamble, /- Occasion: Funeral homily/);
    assert.match(preamble, /- Series: Week 3 of Romans/);
    assert.doesNotMatch(preamble, /Audience \/ setting:/);
    assert.doesNotMatch(preamble, /Additional notes:/);
    assert.match(preamble, /in both your affirmation and[\s\S]*improvement paragraphs/);
    assert.match(
      preamble,
      /not score movement for its own sake/,
    );
    assert.match(
      preamble,
      /This context informs understanding, not leniency/,
    );
  });

  it("uses sermon id in sessionStorage key", () => {
    assert.equal(
      sermonContextStorageKey("abc-123"),
      "sermonContext:abc-123",
    );
  });
});

describe("buildUserMessage context injection", () => {
  const baseInput = {
    sermonTitle: "Test Sermon",
    manuscript: "Opening line.",
  };

  it("leaves the user message unchanged when no context is given", () => {
    const withoutContext = buildUserMessage(baseInput);
    const withUndefined = buildUserMessage({ ...baseInput, context: undefined });

    assert.equal(withoutContext, withUndefined);
    assert.doesNotMatch(withoutContext, /PREACHING CONTEXT/);
  });

  it("injects the preamble before the manuscript when context is present", () => {
    const message = buildUserMessage({
      ...baseInput,
      context: { occasion: "Sunday morning" },
    });

    const manuscriptIndex = message.indexOf("## Manuscript");
    const preambleIndex = message.indexOf("PREACHING CONTEXT");
    const occasionIndex = message.indexOf("- Occasion: Sunday morning");

    assert.ok(preambleIndex >= 0);
    assert.ok(occasionIndex > preambleIndex);
    assert.ok(manuscriptIndex > occasionIndex);
  });
});
