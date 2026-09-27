import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPrepCardBelowMinimum,
  isPrepCardGenerationLimited,
  prepCardEmptyLine,
  prepCardLimitLine,
  prepCardNextAvailableAt,
} from "./generation-limit";

const GENERATED = new Date("2026-09-01T15:00:00.000Z");

describe("prep card generation limit", () => {
  it("blocks a second generation before 30 days, including a flag-only account", () => {
    const justBefore = new Date(
      prepCardNextAvailableAt(GENERATED).getTime() - 1,
    );
    assert.equal(isPrepCardGenerationLimited(GENERATED, justBefore), true);
    assert.equal(
      prepCardLimitLine(prepCardNextAvailableAt(GENERATED), justBefore),
      "Your next prep card is available on 1 October.",
    );
  });

  it("allows a generation once 30 days have passed", () => {
    const availableOn = prepCardNextAvailableAt(GENERATED);
    assert.equal(availableOn.toISOString(), "2026-10-01T15:00:00.000Z");
    assert.equal(isPrepCardGenerationLimited(GENERATED, availableOn), false);
  });

  it("does not limit an account that has never generated a card", () => {
    assert.equal(isPrepCardGenerationLimited(null, GENERATED), false);
  });
});

describe("prep card minimum", () => {
  it("blocks 3 evaluated sermons and allows 4", () => {
    assert.equal(isPrepCardBelowMinimum(3), true);
    assert.equal(
      prepCardEmptyLine(3),
      "Your prep card appears after 4 evaluated sermons. You have 3.",
    );
    assert.equal(isPrepCardBelowMinimum(4), false);
  });
});
