import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coachingNarrativeSchema } from "./coaching-schema";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  parseCriterionNameFromPrincipleTag,
  selectGrowthCriterion,
} from "./growth-edge";
import { extractManuscriptExcerpt } from "./manuscript-excerpt";

describe("coachingNarrativeSchema", () => {
  it("accepts two or three strengths", () => {
    const parsed = coachingNarrativeSchema.parse({
      lead_with_this: [
        {
          claim: "You name the wound before you answer it.",
          quote: "Why is this happening to me?",
          why: "The refrain gives the gospel a real place to land.",
        },
        {
          claim: "You preach propitiation, not pep talk.",
          quote: "Jesus has propitiated God's wrath.",
          why: "Sonship stays tied to the cross.",
        },
      ],
      how_to_grow: {
        edge: "Sharpen the Esau ending before you resolve it.",
        this_week: "Rebuild the last ninety seconds with the fear named aloud.",
      },
      what_it_looks_like: {
        before: "He wept over consequences only.",
        after: "Some of you hear Esau and your stomach tightens.",
        what_changed: "You named the fear before you explained Esau.",
      },
    });

    assert.equal(parsed.lead_with_this.length, 2);
  });
});

describe("selectGrowthCriterion", () => {
  it("resolves top priority #1 via principle_tag", () => {
    const growth = selectGrowthCriterion(EVALUATION_FIXTURE);

    assert.equal(growth.priority.rank, 1);
    assert.equal(growth.criterion.name, "Fallen Condition Focus");
  });

  it("parses principle tags with tradition prefix", () => {
    assert.equal(
      parseCriterionNameFromPrincipleTag("Chapell · Fallen Condition Focus"),
      "Fallen Condition Focus",
    );
  });
});

describe("extractManuscriptExcerpt", () => {
  it("returns a window around a quote in the manuscript", () => {
    const manuscript =
      "Opening paragraph about the race.\n\nMiddle section with the Esau warning and tears.\n\nClosing charge.";
    const excerpt = extractManuscriptExcerpt(
      manuscript,
      "Esau warning and tears",
      20,
    );

    assert.ok(excerpt);
    assert.match(excerpt!, /Esau warning and tears/);
  });
});
