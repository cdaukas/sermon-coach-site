import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearCriterionVerdictLines,
  evaluationResultSchemaForPromptVersion,
  evaluationResultStrictSchema,
  evaluationResultStrictWriteSchema,
  mergeCriterionVerdictLines,
  usesVerdictReadGrandfather,
} from "./schema";
import { EVALUATION_FIXTURE } from "./fixture";
import { validateAndMapVerdictLines, countWords, truncateVerdictLineToMaxWords, hasOverlongVerdictLine } from "./verdict-line-schema";
import { EVALUATION_PROMPT_VERSION } from "./prompt";

describe("criterion verdict_line schema gate", () => {
  it("does not bump prompt version for a non-scoring pass", () => {
    assert.equal(EVALUATION_PROMPT_VERSION, "v3.4");
  });

  it("read path tolerates missing verdict_line on any prompt version", () => {
    const fixture = structuredClone(EVALUATION_FIXTURE);
    assert.equal(evaluationResultStrictSchema.safeParse(fixture).success, true);
    assert.equal(usesVerdictReadGrandfather("v3.4"), false);
    assert.equal(
      evaluationResultSchemaForPromptVersion("v3.4").safeParse(fixture).success,
      true,
    );
    assert.equal(
      evaluationResultSchemaForPromptVersion("v2.2").safeParse(fixture).success,
      true,
    );
    assert.equal(
      evaluationResultSchemaForPromptVersion("fixture-v3").safeParse(fixture)
        .success,
      true,
    );
  });

  it("write schema requires verdict_line keys after the pass", () => {
    const fixture = structuredClone(EVALUATION_FIXTURE);
    assert.equal(
      evaluationResultStrictWriteSchema.safeParse(fixture).success,
      false,
    );

    const withNulls = clearCriterionVerdictLines(fixture as never);
    assert.equal(
      evaluationResultStrictWriteSchema.safeParse(withNulls).success,
      true,
    );
  });

  it("mergeCriterionVerdictLines maps by id", () => {
    const lines = new Map<number, string | null>([
      [1, "Text opened; servant and son distinction holds"],
      [2, null],
    ]);
    const merged = mergeCriterionVerdictLines(
      clearCriterionVerdictLines(EVALUATION_FIXTURE as never),
      lines,
    );
    const c1 = merged.categories[0].criteria.find((c) => c.id === 1);
    const c2 = merged.categories[0].criteria.find((c) => c.id === 2);
    assert.equal(
      c1?.verdict_line,
      "Text opened; servant and son distinction holds",
    );
    assert.equal(c2?.verdict_line, null);
  });

  it("validateAndMapVerdictLines rejects short arrays and duplicate ids", () => {
    assert.throws(() =>
      validateAndMapVerdictLines({
        lines: [{ id: 1, verdict_line: "only one" }],
      }),
    );

    const full = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      verdict_line: `Line for criterion ${i + 1} with enough words here`,
    }));
    full[10] = { id: 1, verdict_line: "duplicate id reuses one" };
    assert.throws(() => validateAndMapVerdictLines({ lines: full }));
  });

  it("validateAndMapVerdictLines accepts full 1–11 and preserves terminal periods", () => {
    const lines = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      verdict_line: `Specific hinge line for criterion ${i + 1}.`,
    }));
    const map = validateAndMapVerdictLines({ lines });
    assert.equal(map.size, 11);
    assert.equal(map.get(1), "Specific hinge line for criterion 1.");
  });

  it("truncateVerdictLineToMaxWords cuts at a clause boundary", () => {
    const long =
      "The two-point frame is clear and memorable, but the Moses comparison which is the argumentative heart is buried as sub-material inside point two without a named beat of its own.";
    const truncated = truncateVerdictLineToMaxWords(long, 18);
    assert.ok(countWords(truncated) <= 18);
    assert.ok(truncated.endsWith("."));
    // Prefer clause cut before ", but" when that prefix fits the cap.
    assert.match(truncated, /clear and memorable/i);
  });

  it("hasOverlongVerdictLine detects lines over the hard ceiling", () => {
    const ok = new Map([[1, "A clear spine holds, but transitions announce rather than create."]]);
    assert.equal(hasOverlongVerdictLine(ok, 18), false);
    const long = new Map([
      [
        1,
        "The two-point frame is clear and memorable, but the Moses comparison which is argumentative heart is buried as sub-material inside point two without a named beat of its own today.",
      ],
    ]);
    assert.equal(hasOverlongVerdictLine(long, 18), true);
  });
});
