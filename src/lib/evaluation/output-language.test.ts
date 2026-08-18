import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayCategoryName,
  displayCriterionName,
  displayScoreBand,
  evaluationReportCopy,
  parseOutputLanguage,
  resolveRequestedOutputLanguage,
  SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
} from "./output-language";

describe("output language gating", () => {
  it("treats anything except es as English", () => {
    assert.equal(parseOutputLanguage("es"), "es");
    assert.equal(parseOutputLanguage("en"), "en");
    assert.equal(parseOutputLanguage("fr"), "en");
    assert.equal(parseOutputLanguage(undefined), "en");
    assert.equal(parseOutputLanguage(true), "en");
  });

  it("ignores a Spanish request unless the account is flagged", () => {
    assert.equal(resolveRequestedOutputLanguage("es", false), "en");
    assert.equal(resolveRequestedOutputLanguage("es", true), "es");
    assert.equal(resolveRequestedOutputLanguage("en", true), "en");
  });
});

describe("Spanish display maps", () => {
  it("keeps English criterion names unless language is es", () => {
    assert.equal(
      displayCriterionName(3, "Gospel clarity", "en"),
      "Gospel clarity",
    );
    assert.equal(
      displayCriterionName(3, "Gospel clarity", "es"),
      "Claridad del evangelio",
    );
  });

  it("maps category ids and score bands for Spanish reports", () => {
    assert.equal(
      displayCategoryName("text_and_theology", "Text & Theology", "es"),
      "Texto y teología",
    );
    assert.equal(displayScoreBand("Faithful", "es"), "Fiel");
    assert.equal(displayScoreBand("Faithful", "en"), "Faithful");
  });

  it("keeps English report chrome by default", () => {
    const copy = evaluationReportCopy("en");
    assert.equal(copy.whereItsStrong, "Where It's Strong");
    assert.equal(copy.eyebrow, "Evaluation");
    assert.equal(copy.melodicLineTitle, "Melodic line and big idea");
    assert.equal(copy.melodicLineBook, "The book");
    assert.equal(copy.melodicLinePassage, "This passage");
    assert.equal(copy.melodicLineReading, "Melodic line");
  });

  it("includes Reina-Valera 1960 in the Spanish output contract", () => {
    assert.match(SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS, /Reina-Valera 1960/);
    assert.match(SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS, /Never free-translate/);
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /canonical English enum/,
    );
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /No em-dashes \(U\+2014\)/,
    );
  });
});
