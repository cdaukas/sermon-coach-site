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
  hasOverlongVerdictLine,
  collectOverlongVerdictLines,
  endsOnIncompleteGrammaticalTail,
  terminalContentWord,
  submitCriterionVerdictLinesTool,
  hasSubjectVerbAgreementIssue,
  detectSubjectVerbAgreementIssue,
  detectSentenceParseIssues,
  failsSentenceParse,
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

/** Observed-line samples (28- and 30-word class) for length-retry tests. */
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
    assert.equal(EVALUATION_PROMPT_VERSION, "v3.5");
  });

  it("read path tolerates missing verdict_line on any prompt version", () => {
    const fixture = structuredClone(EVALUATION_FIXTURE);
    assert.equal(evaluationResultStrictSchema.safeParse(fixture).success, true);
    assert.equal(usesVerdictReadGrandfather("v3.5"), false);
    assert.equal(
      evaluationResultSchemaForPromptVersion("v3.5").safeParse(fixture).success,
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

  it("endsOnIncompleteGrammaticalTail flags mid-sentence fragment terminals from dry-run", () => {
    const fragments = [
      "The claim lands as explanation becomes.",
      "The sermon risks portraying one actual person in actual.",
      "The arc holds in one concrete situation and staying.",
      "The pastoral move arrives without defusing or spiritually.",
      "The unit is two brief notes rather than one sustained.",
    ];
    for (const line of fragments) {
      assert.equal(
        endsOnIncompleteGrammaticalTail(line),
        true,
        `expected incomplete tail: ${line}`,
      );
      assert.equal(
        failsSentenceParse(line),
        true,
        `expected parse failure: ${line}`,
      );
    }
  });

  it("flags known misspelling exgetically for quality retry", () => {
    const line =
      "The servant and son distinction is exgetically grounded in the text.";
    const issues = detectSentenceParseIssues(line);
    assert.ok(
      issues.some((i) => i.reason === "known_misspelling"),
      "expected known_misspelling issue",
    );
    assert.equal(failsSentenceParse(line), true);
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

  it("collectOverlongVerdictLines reports overages without mutating lines", () => {
    const map = new Map([
      [2, LINE_28],
      [10, LINE_30],
      [1, SHORT_OK],
    ]);
    const overlong = collectOverlongVerdictLines(map, VERDICT_LINE_MAX_WORDS);
    assert.equal(overlong.length, 2);
    assert.ok(overlong.some((o) => o.id === 2 && o.wordCount === 28));
    assert.ok(overlong.some((o) => o.id === 10 && o.wordCount === 30));
    // Source map unchanged
    assert.equal(map.get(2), LINE_28);
    assert.equal(map.get(10), LINE_30);
  });

  it("copy contract keeps anti-prescription and allows single-clause", () => {
    const prompt = buildVerdictLineSystemPrompt();
    assert.match(prompt, /must.*should.*would/i);
    assert.match(prompt, /never what the preacher should do next/i);
    assert.match(prompt, /Failed shapes/i);
    assert.match(prompt, /single-clause takeaway is correct/i);
    assert.doesNotMatch(
      prompt,
      /single-clause line with no second half is a failed line/i,
    );
    assert.doesNotMatch(prompt, /scores 1–4 never drop the second half/i);
    assert.match(prompt, /subject and verb must agree/i);
    assert.match(prompt, /Greek is asserted rather than shown/i);
  });
});

describe("verdict-line sentence parse heuristics", () => {
  const LINE_WITH_BUT =
    "Propitiation is handled with care, but the claim outruns the quoted word.";
  const LINE_SINGLE =
    "The Lion-Lamb reversal lands as the text's own structural hinge tonight.";
  const LINE_DETONATE =
    "The Lion-Lamb reversal detonate as the text's own hinge.";
  const LINE_DANGLING =
    "The Lion-Lamb reversal lands as the text's own hinge of.";

  it("accepts single-clause lines at any score (hinge not required)", () => {
    const lines = new Map([
      [1, LINE_SINGLE],
      [2, LINE_SINGLE],
      [3, LINE_WITH_BUT],
    ]);
    const scores = new Map([
      [1, 5],
      [2, 4],
      [3, 3],
    ]);
    const issues = collectVerdictLineQualityIssues(lines, scores);
    assert.equal(issues.length, 0, "single-clause must not fail quality");
    assert.equal(failsSentenceParse(LINE_SINGLE), false);
    assert.equal(failsSentenceParse(LINE_WITH_BUT), false);
  });

  it("flags the detonate subject-verb agreement slip", () => {
    assert.equal(hasSubjectVerbAgreementIssue(LINE_DETONATE), true);
    assert.equal(failsSentenceParse(LINE_DETONATE), true);
    const hit = detectSubjectVerbAgreementIssue(LINE_DETONATE);
    assert.ok(hit);
    assert.match(hit!.subject, /reversal/i);
    assert.equal(hit!.verb, "detonate");

    const parseIssues = detectSentenceParseIssues(LINE_DETONATE);
    assert.ok(
      parseIssues.some((i) => i.reason === "subject_verb_agreement"),
    );

    // Correct agreement should pass.
    assert.equal(
      hasSubjectVerbAgreementIssue(
        "The Lion-Lamb reversal detonates as the text's own hinge.",
      ),
      false,
    );
    assert.equal(
      failsSentenceParse(
        "The Lion-Lamb reversal detonates as the text's own hinge.",
      ),
      false,
    );
    // Good two-part line should not false-positive on SV.
    assert.equal(hasSubjectVerbAgreementIssue(LINE_WITH_BUT), false);
  });

  it("flags dangling grammatical tails as parse failures", () => {
    assert.equal(endsOnIncompleteGrammaticalTail(LINE_DANGLING), true);
    assert.equal(failsSentenceParse(LINE_DANGLING), true);
    const issues = detectSentenceParseIssues(LINE_DANGLING);
    assert.ok(
      issues.some((i) => i.reason === "incomplete_grammatical_tail"),
    );
  });

  it("collectVerdictLineQualityIssues reports SV without requiring hinge", () => {
    const lines = new Map([[2, LINE_DETONATE]]);
    const issues = collectVerdictLineQualityIssues(lines, new Map([[2, 3]]));
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.reason, "subject_verb_agreement");
    assert.ok(!issues.some((i) => i.reason === "incomplete_grammatical_tail"));
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

  it("retries once on overlong batch then ships overages without truncating", async () => {
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

    const c2 = result.categories
      .flatMap((cat) => cat.criteria)
      .find((c) => c.id === 2);
    const c10 = result.categories
      .flatMap((cat) => cat.criteria)
      .find((c) => c.id === 10);
    // Retry still overlong → ship full lines, never mid-sentence cut.
    assert.equal(c2?.verdict_line, normalizePeriod(LINE_28));
    assert.equal(c10?.verdict_line, normalizePeriod(LINE_30));
    assert.equal(countWords(c2!.verdict_line!), 28);
    assert.equal(countWords(c10!.verdict_line!), 30);
  });

  it("ships short batch without a length retry", async () => {
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

  it("retries once for sentence-parse (SV) and merges only fixed ids", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const SINGLE =
      "The Lion-Lamb reversal lands as the text's own structural hinge.";
    const DETONATE =
      "The Lion-Lamb reversal detonate as the text's own hinge.";
    const FIXED =
      "The Lion-Lamb reversal detonates as the text's own structural hinge.";

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
        // id 2: single-clause OK at score 3; id 3: SV slip only; id 5: single OK
        return messageWithVerdictLines(
          elevenLines({
            2: SINGLE,
            3: DETONATE,
            5: SINGLE,
          }),
        );
      }

      // Quality retry: only id 3 (SV) — single-clause must not trigger retry.
      assert.match(user, /RETRY \(targeted criteria/);
      assert.match(user, /Criterion 3/);
      assert.doesNotMatch(user, /Criterion 2/);
      return messageWithVerdictLines([
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
    assert.equal(byId.get(2), normalizePeriod(SINGLE));
    assert.equal(byId.get(3), normalizePeriod(FIXED));
    assert.equal(byId.get(5), normalizePeriod(SINGLE));
  });
});
