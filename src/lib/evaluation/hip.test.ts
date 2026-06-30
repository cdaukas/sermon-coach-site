import assert from "node:assert/strict";
import { test } from "node:test";
import { isHowItPreachesEnabled } from "./feature-flags";
import {
  HIP_MOVEMENT_NAMES,
  howItPreachesSchema,
  validateHowItPreachesMovements,
} from "./hip-schema";

test("isHowItPreachesEnabled is off without DEMO_ACCOUNT_USER_ID", () => {
  const original = process.env.DEMO_ACCOUNT_USER_ID;
  delete process.env.DEMO_ACCOUNT_USER_ID;
  try {
    assert.equal(isHowItPreachesEnabled("any-user"), false);
  } finally {
    if (original === undefined) {
      delete process.env.DEMO_ACCOUNT_USER_ID;
    } else {
      process.env.DEMO_ACCOUNT_USER_ID = original;
    }
  }
});

test("isHowItPreachesEnabled matches demo account only", () => {
  const original = process.env.DEMO_ACCOUNT_USER_ID;
  process.env.DEMO_ACCOUNT_USER_ID = "demo-user-123";
  try {
    assert.equal(isHowItPreachesEnabled("demo-user-123"), true);
    assert.equal(isHowItPreachesEnabled("other-user"), false);
  } finally {
    if (original === undefined) {
      delete process.env.DEMO_ACCOUNT_USER_ID;
    } else {
      process.env.DEMO_ACCOUNT_USER_ID = original;
    }
  }
});

test("howItPreachesSchema requires five movements in canonical order", () => {
  const movements = HIP_MOVEMENT_NAMES.map((name) => ({
    name,
    body: `Prose for ${name} with <span class="q">quote</span>.`,
  }));

  const parsed = howItPreachesSchema.parse({ movements });
  assert.equal(validateHowItPreachesMovements(parsed).movements.length, 5);
});
