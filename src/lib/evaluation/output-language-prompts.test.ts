import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
  SPANISH_HIP_OUTPUT_INSTRUCTIONS,
  SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS,
} from "./output-language-prompts";

describe("output language prompts", () => {
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
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /must begin by naming the book/,
    );
  });

  it("keeps the English movement enum in the Spanish HIP contract", () => {
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /Never free-translate/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /Latin American register/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /class="q"/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /The Open/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /The Big Idea/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /The Structural Logic/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /The Illustrations/);
    assert.match(SPANISH_HIP_OUTPUT_INSTRUCTIONS, /The Landing/);
  });

  it("restates the word band and the Scripture rules for verdict lines", () => {
    assert.match(SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS, /Reina-Valera 1960/);
    assert.match(
      SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS,
      /Never free-translate/,
    );
    assert.match(
      SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS,
      /twelve-to-eighteen-word/,
    );
    assert.match(
      SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS,
      /Canonical criterion names in this prompt stay English/,
    );
    assert.match(
      SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS,
      /Quotes of the preacher stay in the manuscript's language/,
    );
  });
});
