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

  it("enforce path rejects incomplete truncates for the five fragment endings", () => {
    // Overlong lines whose naïve 18-word cut would end on each bad terminal.
    const pad =
      "The sermon works carefully through the text and frame today so filler words pad past the length";
    // Build: ... pad (many words) ending forced via known bad terminals by using lines
    // long enough that hard-cut at 18 would hit the fragment end.
    const cases: Array<{ ending: string; last: string }> = [
      {
        ending:
          "The claim finally settles as explanation becomes",
        last: "becomes",
      },
      {
        ending:
          "The sermon risks portraying one actual person in actual",
        last: "actual",
      },
      {
        ending:
          "The arc holds only in one concrete situation and staying",
        last: "staying",
      },
      {
        ending:
          "The pastoral move arrives without defusing or spiritually",
        last: "spiritually",
      },
      {
        ending:
          "The unit remains two brief notes rather than one sustained",
        last: "sustained",
      },
    ];

    for (const { ending, last } of cases) {
      // Ensure over-cap when combined, and 18-word prefix ends on the bad word.
      const words = ending.split(/\s+/);
      assert.ok(
        words.length <= VERDICT_LINE_MAX_WORDS,
        `base ending for ${last} should be ≤ max for prefix control`,
      );
      // Prefix the ending so total exceeds cap; walk-back should still only
      // find under-cap cuts at or before the incomplete last word.
      const overlong = normalizePeriod(
        `${pad} ${ending}`,
      );
      assert.ok(
        countWords(overlong) > VERDICT_LINE_MAX_WORDS,
        `need overlong for ${last}`,
      );
      assert.equal(
        terminalContentWord(ending + "."),
        last,
        `fixture ends on ${last}`,
      );
      assert.equal(endsOnIncompleteGrammaticalTail(ending + "."), true);

      // Direct truncate of a sentence that hard-caps onto the fragment.
      // Construct: first (max- lastWordCount) neutral words + ending words so end === 18.
      const endingWords = ending.split(/\s+/);
      const headCount = VERDICT_LINE_MAX_WORDS - endingWords.length;
      assert.ok(headCount >= 1, `need head room for ${last}`);
      const head = Array.from({ length: headCount }, () => "word").join(" ");
      const forced = normalizePeriod(`${head} ${ending}`);
      assert.equal(countWords(forced), VERDICT_LINE_MAX_WORDS);
      // Under-cap already: enforce no-ops; endsOn still flags.
      // Make it overlong by prepending, forcing truncate path.
      const forceTruncate = normalizePeriod(
        `Extra words fill the front of this line for length ${forced}`,
      );
      assert.ok(countWords(forceTruncate) > VERDICT_LINE_MAX_WORDS);

      const truncated = truncateVerdictLineToMaxWords(
        forceTruncate,
        VERDICT_LINE_MAX_WORDS,
      );
      if (truncated !== null) {
        assert.notEqual(
          terminalContentWord(truncated),
          last,
          `truncate must not end on ${last}: ${truncated}`,
        );
        assert.equal(
          endsOnIncompleteGrammaticalTail(truncated),
          false,
          `truncate must be complete: ${truncated}`,
        );
      }

      const { lines, rejectedBrokenTruncate } = enforceVerdictLineWordCap(
        new Map([[1, forceTruncate]]),
        VERDICT_LINE_MAX_WORDS,
      );
      const shipped = lines.get(1)!;
      assert.notEqual(
        terminalContentWord(shipped),
        last,
        `enforce must not ship ending "${last}": ${shipped}`,
      );
      assert.equal(
        endsOnIncompleteGrammaticalTail(shipped),
        false,
        `shipped line must parse complete: ${shipped}`,
      );
      // Either truncated to a complete under-cap line, or kept full complete overlong.
      if (countWords(shipped) > VERDICT_LINE_MAX_WORDS) {
        assert.ok(
          rejectedBrokenTruncate.some((r) => r.id === 1),
          `overlong keep for ${last} should be logged`,
        );
      }
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
