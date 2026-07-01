import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  HIP_MOVEMENT_NAMES,
  howItPreachesSchema,
  validateHowItPreachesMovements,
} from "./hip-schema";
import {
  HowItPreachesError,
  runHowItPreachesBestEffort,
} from "./runHowItPreaches";

test("howItPreachesSchema requires five movements in canonical order", () => {
  const movements = HIP_MOVEMENT_NAMES.map((name) => ({
    name,
    body: `Prose for ${name} with <span class="q">quote</span>.`,
  }));

  const parsed = howItPreachesSchema.parse({ movements });
  assert.equal(validateHowItPreachesMovements(parsed).movements.length, 5);
});

describe("runHowItPreachesBestEffort", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
  });

  test("returns null when generation throws without failing the caller", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const result = await runHowItPreachesBestEffort(
      {
        sermonTitle: "Test Sermon",
        manuscript: "Opening line.",
      },
      { evaluationId: "eval-123", userId: "user-456" },
      {
        createMessage: async () => {
          throw new HowItPreachesError("forced HIP failure", "api");
        },
      },
    );

    assert.equal(result.howItPreaches, null);
    assert.equal(result.inputTokens, 0);
    assert.equal(result.outputTokens, 0);
  });
});
