import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalCriterionNameForId,
  criterionIdFromName,
  normalizeLegacyCriterionNames,
} from "./criterion-names";
import { EVALUATION_FIXTURE } from "./fixture";
import { parseEvaluationResult } from "./schema";

describe("normalizeLegacyCriterionNames", () => {
  it("rewrites Heat Map: emotional delivery onto canonical id 8", () => {
    const input = {
      categories: [
        {
          criteria: [
            { id: 8, name: "Heat Map: emotional delivery" },
          ],
        },
      ],
    };

    const normalized = normalizeLegacyCriterionNames(input) as typeof input;
    assert.equal(
      normalized.categories[0].criteria[0].name,
      canonicalCriterionNameForId(8),
    );
  });

  it("leaves ids outside 1–11 unchanged", () => {
    const input = {
      categories: [{ criteria: [{ id: 99, name: "Not a criterion" }] }],
    };
    const normalized = normalizeLegacyCriterionNames(input) as typeof input;
    assert.equal(normalized.categories[0].criteria[0].name, "Not a criterion");
  });
});

describe("criterionIdFromName", () => {
  it("resolves the Heat Map alias to id 8", () => {
    assert.equal(criterionIdFromName("Heat Map: emotional delivery"), 8);
    assert.equal(criterionIdFromName(canonicalCriterionNameForId(8)!), 8);
  });
});

describe("parseEvaluationResult", () => {
  it("does not drop a v3.1 result whose criterion 8 still uses the Heat Map label", () => {
    const stale = structuredClone(EVALUATION_FIXTURE) as typeof EVALUATION_FIXTURE;
    for (const category of stale.categories) {
      for (const criterion of category.criteria) {
        if (criterion.id === 8) {
          criterion.name = "Heat Map: emotional delivery" as typeof criterion.name;
        }
      }
    }

    const parsed = parseEvaluationResult(stale, {
      promptVersion: "v3.1",
      evaluationId: "62bbbe6e-4f05-4304-b40e-3d94c0696dc7",
    });

    assert.ok(parsed);
    const criterion8 = parsed.categories
      .flatMap((category) => category.criteria)
      .find((criterion) => criterion.id === 8);
    assert.equal(criterion8?.name, canonicalCriterionNameForId(8));
  });
});
