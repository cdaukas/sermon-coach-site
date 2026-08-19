import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVALUATION_FIXTURE } from "./fixture";
import { buildSystemPrompt, EVALUATION_PROMPT_VERSION } from "./prompt";
import { evaluationResultStrictSchema } from "./schema";
import {
  CANONICAL_CRITERION_NAMES,
  CANONICAL_TRADITION_TAGS,
  traditionTagForCriterion,
} from "./tool-schema";

describe("locked tradition_tag", () => {
  it("uses author · work for all eleven criteria, never the criterion name in the work slot for FCF", () => {
    const expected: Record<number, string> = {
      1: "Simeon Trust · Expositional Preaching",
      2: "Chapell · Christ-Centered Preaching",
      3: "Piper · The Supremacy of God in Preaching",
      4: "Chapell · Christ-Centered Preaching",
      5: "Robinson · Biblical Preaching",
      6: "Simeon Trust · Workshop practice",
      7: "Keller · Preaching",
      8: "Piper · Expository Exultation",
      9: "Keller · Preaching",
      10: "9Marks · Preach",
      11: "Piper · Expository Exultation",
    };

    for (let id = 1; id <= 11; id++) {
      assert.equal(CANONICAL_TRADITION_TAGS[id], expected[id]);
      assert.equal(traditionTagForCriterion(id, "garbage"), expected[id]);
      const work = expected[id]!.split(" · ")[1];
      assert.ok(work && work.length > 0, `criterion ${id} missing work slot`);
      if (id !== 11) {
        assert.notEqual(
          work.toLowerCase(),
          CANONICAL_CRITERION_NAMES[id - 1].toLowerCase(),
          `criterion ${id} work slot must not be the criterion name`,
        );
      }
    }

    assert.equal(
      CANONICAL_TRADITION_TAGS[4],
      "Chapell · Christ-Centered Preaching",
    );
    assert.doesNotMatch(
      CANONICAL_TRADITION_TAGS[4]!,
      /Fallen Condition Focus/,
    );
  });

  it("overwrites a stored FCF tag that used the criterion name as the work", () => {
    const clone = structuredClone(EVALUATION_FIXTURE);
    const fcf = clone.categories[1]?.criteria.find((c) => c.id === 4);
    assert.ok(fcf);
    fcf.tradition_tag = "Chapell · Fallen Condition Focus";

    const parsed = evaluationResultStrictSchema.parse(clone);
    const parsedFcf = parsed.categories[1]?.criteria.find((c) => c.id === 4);
    assert.equal(
      parsedFcf?.tradition_tag,
      "Chapell · Christ-Centered Preaching",
    );
  });
});

describe("v3.5 live-run prompt locks", () => {
  it("stays on v3.5 and forbids em-dashes, locks FCF's work, and places the melodic observation last", () => {
    assert.equal(EVALUATION_PROMPT_VERSION, "v3.5");
    const prompt = buildSystemPrompt();
    assert.match(prompt, /NO EM-DASHES IN GENERATED PROSE/);
    assert.match(
      prompt,
      /Criterion 4 is Chapell's book, not "Fallen Condition Focus"/,
    );
    assert.match(
      prompt,
      /4: Chapell · Christ-Centered Preaching/,
    );
    assert.match(
      prompt,
      /start a new paragraph of two or three sentences: observation plus question/,
    );
    assert.match(
      prompt,
      /Never embed that observation mid-paragraph or before the close/,
    );
    assert.match(
      prompt,
      /Always begin by naming the book in the first clause/,
    );
  });
});
