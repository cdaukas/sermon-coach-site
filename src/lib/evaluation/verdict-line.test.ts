import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import {
  clearCriterionVerdictLines,
  evaluationResultSchemaForPromptVersion,
  evaluationResultStrictSchema,
  evaluationResultStrictWriteSchema,
  mergeCriterionVerdictLines,
  usesVerdictReadGrandfather,
} from "./schema";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  validateAndMapVerdictLines,
  countWords,
  truncateVerdictLineToMaxWords,
  hasOverlongVerdictLine,
  enforceVerdictLineWordCap,
  submitCriterionVerdictLinesTool,
} from "./verdict-line-schema";
import {
  buildVerdictLineSystemPrompt,
  VERDICT_LINE_MAX_WORDS,
} from "./verdict-line-prompt";
import {
  runCriterionVerdictLines,
  type CreateVerdictLineMessage,
} from "./runCriterionVerdictLines";
import { EVALUATION_PROMPT_VERSION } from "./prompt";

/** Observed-line samples (28- and 30-word class) that previously landed uncapped. */
const LINE_28 =
  "The servant and son distinction is exegetically grounded in therapone's nobility, but the word study earns its place when tied back to the sermon's main claim in full.";
const LINE_30 =
  "The two-point frame is clear and memorable, but the Moses comparison which is the argumentative heart is buried as sub-material inside point two without a named beat of its own.";

const SHORT_OK =
  "Propitiation is handled with care, but the claim outruns the quoted word.";

function elevenLines(
  overrides: Partial<Record<number, string>> = {},
): { id: number; verdict_line: string }[] {
  return Array.from({ length: 11 }, (_, i) => {
    const id = i + 1;
    return {
      id,
      verdict_line: overrides[id] ?? `${SHORT_OK.replace(/\.$/, "")} ${id}.`,
    };
  });
}

function messageWithVerdictLines(
  lines: { id: number; verdict_line: string }[],
  model = "claude-haiku-test",
  usage: Anthropic.Messages.Usage = { input_tokens: 10, output_tokens: 20 },
): Anthropic.Messages.Message {
  return {
    id: "msg_verdict_test",
    type: "message",
    role: "assistant",
    model,
    content: [
      {
        type: "tool_use",
        id: "toolu_verdict",
        name: submitCriterionVerdictLinesTool.name,
        input: { lines },
      },
    ],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage,
  };
}

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
    const truncated = truncateVerdictLineToMaxWords(LINE_30, 18);
    assert.ok(countWords(truncated) <= 18);
    assert.ok(truncated.endsWith("."));
    // Prefer clause cut before ", but" when that prefix fits the cap.
    assert.match(truncated, /clear and memorable/i);
  });

  it("hasOverlongVerdictLine is true for 28- and 30-word observed lines", () => {
    assert.equal(countWords(LINE_28), 28);
    assert.equal(countWords(LINE_30), 30);
    const map = new Map([
      [2, LINE_28],
      [10, LINE_30],
    ]);
    assert.equal(hasOverlongVerdictLine(map, VERDICT_LINE_MAX_WORDS), true);
    assert.equal(
      hasOverlongVerdictLine(new Map([[1, SHORT_OK]]), VERDICT_LINE_MAX_WORDS),
      false,
    );
  });

  it("enforceVerdictLineWordCap caps every overlong line to ≤18 at clause boundary", () => {
    const map = new Map([
      [2, LINE_28],
      [10, LINE_30],
      [1, SHORT_OK],
    ]);
    const capped = enforceVerdictLineWordCap(map, VERDICT_LINE_MAX_WORDS);
    for (const line of capped.values()) {
      assert.ok(countWords(line) <= VERDICT_LINE_MAX_WORDS);
      assert.ok(line.endsWith("."));
    }
    assert.equal(capped.get(1), normalizePeriod(SHORT_OK));
    assert.match(capped.get(10) ?? "", /clear and memorable/i);
  });

  it("copy contract forbids prescription in the concession half", () => {
    const prompt = buildVerdictLineSystemPrompt();
    assert.match(prompt, /must.*should.*would/i);
    assert.match(prompt, /never what the preacher should do next/i);
    assert.match(prompt, /Failed concession shapes/i);
  });
});

function normalizePeriod(s: string): string {
  const t = s.trim();
  return t.endsWith(".") ? t : `${t}.`;
}

describe("runCriterionVerdictLines length gate", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
  });

  it("retries once on overlong batch then truncates before merge", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    let createCalls = 0;
    const overlongBatch = elevenLines({ 2: LINE_28, 10: LINE_30 });
    const stillOverlongBatch = elevenLines({
      2: LINE_28,
      10: LINE_30,
    });

    const createMessage: CreateVerdictLineMessage = async () => {
      createCalls += 1;
      const lines = createCalls === 1 ? overlongBatch : stillOverlongBatch;
      return messageWithVerdictLines(lines, "claude-haiku-test", {
        input_tokens: createCalls === 1 ? 11 : 22,
        output_tokens: createCalls === 1 ? 12 : 24,
      });
    };

    const base = clearCriterionVerdictLines(EVALUATION_FIXTURE as never);
    const { result, inputTokens, outputTokens } = await runCriterionVerdictLines(
      base,
      { createMessage },
    );

    assert.equal(createCalls, 2, "expect one generate + one length retry");
    assert.equal(inputTokens, 33);
    assert.equal(outputTokens, 36);

    for (const category of result.categories) {
      for (const c of category.criteria) {
        assert.ok(c.verdict_line, `criterion ${c.id} missing verdict_line`);
        assert.ok(
          countWords(c.verdict_line) <= VERDICT_LINE_MAX_WORDS,
          `criterion ${c.id} still overlong: ${countWords(c.verdict_line!)} words — ${c.verdict_line}`,
        );
      }
    }

    const c2 = result.categories
      .flatMap((cat) => cat.criteria)
      .find((c) => c.id === 2);
    const c10 = result.categories
      .flatMap((cat) => cat.criteria)
      .find((c) => c.id === 10);
    assert.ok(c2?.verdict_line);
    assert.ok(c10?.verdict_line);
    assert.notEqual(c2?.verdict_line, normalizePeriod(LINE_28));
    assert.notEqual(c10?.verdict_line, normalizePeriod(LINE_30));
  });

  it("enforces the word cap even when the first pass only is under the ceil path", async () => {
    // Defense-in-depth: single short batch still goes through enforce (no-op).
    process.env.ANTHROPIC_API_KEY = "test-key";
    let createCalls = 0;
    const createMessage: CreateVerdictLineMessage = async () => {
      createCalls += 1;
      return messageWithVerdictLines(elevenLines());
    };

    const base = clearCriterionVerdictLines(EVALUATION_FIXTURE as never);
    const { result } = await runCriterionVerdictLines(base, { createMessage });
    assert.equal(createCalls, 1);
    for (const category of result.categories) {
      for (const c of category.criteria) {
        assert.ok(c.verdict_line);
        assert.ok(countWords(c.verdict_line) <= VERDICT_LINE_MAX_WORDS);
      }
    }
  });
});
