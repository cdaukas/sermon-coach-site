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
        church: "  First Baptist  ",
        occasion: "  Sunday morning  ",
        audience: "",
        series: "   ",
        other: "Guest preacher",
      }),
      {
        church: "First Baptist",
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
      church: "Grace Chapel",
      occasion: "Funeral homily",
      series: "Week 3 of Romans",
    });

    assert.match(preamble, /- Church: Grace Chapel/);
    assert.match(preamble, /- Occasion: Funeral homily/);
    assert.match(preamble, /- Series: Week 3 of Romans/);
    assert.doesNotMatch(preamble, /Audience \/ setting:/);
    assert.doesNotMatch(preamble, /Additional notes:/);
    assert.doesNotMatch(preamble, /Working melodic line/);
    assert.doesNotMatch(preamble, /MELODIC LINE OVERRIDE/);
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

  it("includes a preacher-named melodic line as an override, not as generic notes", () => {
    const preamble = buildContextPreamble({
      workingMelodicLine:
        "Partnership in the gospel that holds under pressure because Christ is the pattern and the prize.",
    });

    assert.match(
      preamble,
      /Working melodic line for this book \(named by the preacher\): Partnership in the gospel/,
    );
    assert.match(preamble, /MELODIC LINE OVERRIDE/);
    assert.match(preamble, /reading_source` to `preacher/);
    assert.doesNotMatch(preamble, /Additional notes:/);
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

  it("injects the primary passage and derived book before the manuscript", () => {
    const message = buildUserMessage({
      ...baseInput,
      primaryPassage: "Hebrews 12:5-17",
    });

    const manuscriptIndex = message.indexOf("## Manuscript");
    const passageIndex = message.indexOf(
      "**Primary passage (provided by the preacher):** Hebrews 12:5-17",
    );
    const bookIndex = message.indexOf(
      "**Derived book (from the primary passage, not from any series title):** Hebrews",
    );

    assert.ok(passageIndex >= 0);
    assert.ok(bookIndex > passageIndex);
    assert.ok(manuscriptIndex > bookIndex);
    assert.match(message, /Use the preacher-provided primary passage above/);
  });

  it("omits Spanish output instructions for English evaluations", () => {
    const message = buildUserMessage(baseInput);
    assert.doesNotMatch(message, /OUTPUT LANGUAGE \(SPANISH\)/);
    assert.doesNotMatch(message, /Reina-Valera 1960/);
  });

  it("appends Spanish output and scripture instructions when outputLanguage is es", () => {
    const message = buildUserMessage({
      ...baseInput,
      outputLanguage: "es",
    });

    const languageIndex = message.indexOf("OUTPUT LANGUAGE (SPANISH)");
    const scriptureIndex = message.indexOf("Reina-Valera 1960");
    const manuscriptIndex = message.indexOf("## Manuscript");

    assert.ok(languageIndex >= 0);
    assert.ok(scriptureIndex > languageIndex);
    assert.ok(manuscriptIndex > scriptureIndex);
    assert.match(message, /Never free-translate a verse/);
    assert.match(message, /canonical English enum/);
  });
});
