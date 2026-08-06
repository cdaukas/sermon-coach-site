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
  endsOnIncompleteGrammaticalTail,
  terminalContentWord,
  submitCriterionVerdictLinesTool,
  hasVerdictHinge,
  isSingleClauseVerdictLine,
  hasSubjectVerbAgreementIssue,
  detectSubjectVerbAgreementIssue,
  collectVerdictLineQualityIssues,
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

/** Overlong line whose 18-word hard cut ends on dangling "than" (clause prefix too short for min-8). */
const LINE_DANGLING_THAN =
  "The verdict is vivid, but the offense of guilt precedes the comfort less clearly than grace would require of this room.";

/**
 * No complete ≥8-word prefix under the 18-word cap (all 8..18 terminals
 * are incomplete tails), but the full line itself ends complete.
 */
const LINE_FORCE_REJECT =
  "and or but of to with for from than more less of to with for from than more less of to with for grounded claims.";

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
    assert.ok(truncated !== null);
    assert.ok(countWords(truncated!) <= 18);
    assert.ok(truncated!.endsWith("."));
    // Prefer clause cut before ", but" when that prefix fits the cap.
    assert.match(truncated!, /clear and memorable/i);
  });

  it("endsOnIncompleteGrammaticalTail flags dangling than/but/of/to/with", () => {
    for (const dangling of [
      "The offense precedes the comfort less clearly than.",
      "The distinction is grounded, but.",
      "The claim outruns the word of.",
      "The spine holds the room to.",
      "The text opens on identity with.",
    ]) {
      assert.equal(
        endsOnIncompleteGrammaticalTail(dangling),
        true,
        `expected incomplete: ${dangling}`,
      );
    }
    assert.equal(
      endsOnIncompleteGrammaticalTail(SHORT_OK),
      false,
    );
    assert.equal(terminalContentWord("… less clearly than."), "than");
  });

  it("truncate rejects a hard cut ending on dangling than (no broken than.)", () => {
    assert.ok(countWords(LINE_DANGLING_THAN) > VERDICT_LINE_MAX_WORDS);
    const truncated = truncateVerdictLineToMaxWords(LINE_DANGLING_THAN, 18);
    // May shorten via walk-back, but never end on "than"
    if (truncated !== null) {
      assert.notEqual(terminalContentWord(truncated), "than");
      assert.equal(endsOnIncompleteGrammaticalTail(truncated), false);
      assert.ok(countWords(truncated) <= 18);
    }
  });

  it("truncate returns null when every under-cap candidate is incomplete", () => {
    assert.equal(truncateVerdictLineToMaxWords(LINE_FORCE_REJECT, 18), null);
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

  it("enforceVerdictLineWordCap caps clean overlong lines and keeps broken-truncate rejects", () => {
    const map = new Map([
      [2, LINE_28],
      [10, LINE_30],
      [1, SHORT_OK],
      [3, LINE_FORCE_REJECT],
    ]);
    const { lines: capped, rejectedBrokenTruncate } = enforceVerdictLineWordCap(
      map,
      VERDICT_LINE_MAX_WORDS,
    );

    assert.ok(countWords(capped.get(2)!) <= VERDICT_LINE_MAX_WORDS);
    assert.ok(countWords(capped.get(10)!) <= VERDICT_LINE_MAX_WORDS);
    assert.equal(capped.get(1), normalizePeriod(SHORT_OK));
    assert.match(capped.get(10) ?? "", /clear and memorable/i);

    // Force-reject line stays overlong rather than shipping dangling tail
    assert.equal(capped.get(3), normalizePeriod(LINE_FORCE_REJECT));
    assert.ok(countWords(capped.get(3)!) > VERDICT_LINE_MAX_WORDS);
    assert.equal(rejectedBrokenTruncate.length, 1);
    assert.equal(rejectedBrokenTruncate[0]?.id, 3);
  });

  it("copy contract requires hinge below 5 and forbids prescription", () => {
    const prompt = buildVerdictLineSystemPrompt();
    assert.match(prompt, /must.*should.*would/i);
    assert.match(prompt, /never what the preacher should do next/i);
    assert.match(prompt, /Failed shapes/i);
    assert.match(prompt, /single-clause line.*failed line on any score below 5/i);
    assert.match(prompt, /Do not drop the concession half/i);
    assert.match(
      prompt,
      /Greek is asserted rather than shown/i,
    );
  });
});

describe("verdict-line hinge and SV quality heuristics", () => {
  const LINE_WITH_BUT =
    "Propitiation is handled with care, but the claim outruns the quoted word.";
  const LINE_WITH_SEMI =
    "The spine is clear; the transitions announce movement instead of creating it.";
  const LINE_WITH_COMMA_AND =
    "The servant and son distinction is grounded, and the text opens on that hinge.";
  const LINE_SINGLE =
    "The Lion-Lamb reversal lands as the text's own structural hinge tonight.";
  const LINE_DETONATE =
    "The Lion-Lamb reversal detonate as the text's own hinge.";

  it("detects single-clause lines without hinge markers", () => {
    assert.equal(isSingleClauseVerdictLine(LINE_SINGLE), true);
    assert.equal(hasVerdictHinge(LINE_SINGLE), false);

    assert.equal(isSingleClauseVerdictLine(LINE_WITH_BUT), false);
    assert.equal(hasVerdictHinge(LINE_WITH_BUT), true);
    assert.equal(hasVerdictHinge(LINE_WITH_SEMI), true);
    assert.equal(hasVerdictHinge(LINE_WITH_COMMA_AND), true);
    assert.equal(hasVerdictHinge("Clear claim though the quote is thin."), true);
    assert.equal(hasVerdictHinge("A spine holds while the arc stalls."), true);
    assert.equal(hasVerdictHinge("The claim stands yet the cost is unnamed."), true);
  });

  it("score 5 is exempt from the both-halves rule; score 4 single-clause is invalid", () => {
    const lines = new Map([
      [1, LINE_SINGLE],
      [2, LINE_SINGLE],
      [3, LINE_WITH_BUT],
    ]);
    const scores = new Map([
      [1, 5],
      [2, 4],
      [3, 4],
    ]);
    const issues = collectVerdictLineQualityIssues(lines, scores);
    const hingeIssues = issues.filter((i) => i.reason === "missing_hinge");
    assert.equal(
      hingeIssues.some((i) => i.id === 1),
      false,
      "score 5 single-clause should be exempt",
    );
    assert.equal(
      hingeIssues.some((i) => i.id === 2),
      true,
      "score 4 single-clause must be invalid",
    );
    assert.equal(
      hingeIssues.some((i) => i.id === 3),
      false,
      "hinged score 4 is valid",
    );
  });

  it("flags the detonate subject-verb agreement slip", () => {
    assert.equal(hasSubjectVerbAgreementIssue(LINE_DETONATE), true);
    const hit = detectSubjectVerbAgreementIssue(LINE_DETONATE);
    assert.ok(hit);
    assert.match(hit!.subject, /reversal/i);
    assert.equal(hit!.verb, "detonate");

    // Correct agreement should pass.
    assert.equal(
      hasSubjectVerbAgreementIssue(
        "The Lion-Lamb reversal detonates as the text's own hinge.",
      ),
      false,
    );
    // Good two-part line should not false-positive on SV.
    assert.equal(hasSubjectVerbAgreementIssue(LINE_WITH_BUT), false);
  });

  it("collectVerdictLineQualityIssues stacks hinge and SV reasons", () => {
    const lines = new Map([[2, LINE_DETONATE]]);
    // detonate line is also single-clause; score 3
    const issues = collectVerdictLineQualityIssues(lines, new Map([[2, 3]]));
    const reasons = new Set(issues.map((i) => i.reason));
    assert.ok(reasons.has("missing_hinge"));
    assert.ok(reasons.has("subject_verb_agreement"));
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

  it("keeps uncapped attempt when truncate would dangle rather than ship broken", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    let createCalls = 0;
    const batch = elevenLines({ 3: LINE_FORCE_REJECT });

    const createMessage: CreateVerdictLineMessage = async () => {
      createCalls += 1;
      return messageWithVerdictLines(batch, "claude-haiku-test", {
        input_tokens: 15,
        output_tokens: 18,
      });
    };

    const base = clearCriterionVerdictLines(EVALUATION_FIXTURE as never);
    const { result } = await runCriterionVerdictLines(base, { createMessage });

    assert.ok(createCalls >= 1);
    const c3 = result.categories
      .flatMap((cat) => cat.criteria)
      .find((c) => c.id === 3);
    assert.equal(c3?.verdict_line, normalizePeriod(LINE_FORCE_REJECT));
    assert.ok(countWords(c3!.verdict_line!) > VERDICT_LINE_MAX_WORDS);
    assert.equal(endsOnIncompleteGrammaticalTail(c3!.verdict_line!), false);
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

  it("retries once for quality (hinge/SV) and merges only fixed ids", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const SINGLE =
      "The Lion-Lamb reversal lands as the text's own structural hinge.";
    const DETONATE =
      "The Lion-Lamb reversal detonate as the text's own hinge.";
    const FIXED =
      "The Lion-Lamb reversal detonates, but the cost half stays named.";

    // Build a fixture where criteria 2 and 3 score below 5 (need hinge).
    const base = clearCriterionVerdictLines(
      structuredClone(EVALUATION_FIXTURE) as never,
    );
    for (const category of base.categories) {
      for (const c of category.criteria) {
        if (c.id === 2 || c.id === 3) c.score = 3;
        if (c.id === 5) c.score = 5;
      }
    }

    let createCalls = 0;
    const createMessage: CreateVerdictLineMessage = async (params) => {
      createCalls += 1;
      const user =
        typeof params.messages[0]?.content === "string"
          ? params.messages[0].content
          : "";

      if (createCalls === 1) {
        // id 2: single-clause (invalid at score 3); id 3: SV slip; id 5: single ok at 5
        return messageWithVerdictLines(
          elevenLines({
            2: SINGLE,
            3: DETONATE,
            5: SINGLE,
          }),
        );
      }

      // Quality retry: only repair requested ids.
      assert.match(user, /RETRY \(targeted criteria/);
      assert.match(user, /Criterion 2/);
      assert.match(user, /Criterion 3/);
      return messageWithVerdictLines([
        { id: 2, verdict_line: FIXED },
        { id: 3, verdict_line: FIXED },
      ]);
    };

    const { result } = await runCriterionVerdictLines(base, { createMessage });
    assert.equal(createCalls, 2);

    const byId = new Map(
      result.categories.flatMap((cat) =>
        cat.criteria.map((c) => [c.id, c.verdict_line] as const),
      ),
    );
    assert.equal(byId.get(2), normalizePeriod(FIXED));
    assert.equal(byId.get(3), normalizePeriod(FIXED));
    // Score 5 single-clause kept without forcing a second half.
    assert.equal(byId.get(5), normalizePeriod(SINGLE));
  });
});
