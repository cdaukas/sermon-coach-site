import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { buildHowItPreachesUserMessage } from "./hip-prompt";
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

test("Spanish HIP prompt writes body in Spanish and keeps English movement names", () => {
  const english = buildHowItPreachesUserMessage({
    sermonTitle: "Test Sermon",
    manuscript: "Opening line.",
  });
  const spanish = buildHowItPreachesUserMessage({
    sermonTitle: "Test Sermon",
    manuscript: "Opening line.",
    outputLanguage: "es",
  });

  assert.doesNotMatch(english, /OUTPUT LANGUAGE \(SPANISH\)/);
  assert.match(spanish, /OUTPUT LANGUAGE \(SPANISH\)/);
  assert.match(spanish, /Reina-Valera 1960/);
  assert.match(spanish, /Keep each movement `name` as the English enum/);
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
