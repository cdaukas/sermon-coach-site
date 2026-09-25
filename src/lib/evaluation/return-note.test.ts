import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEEP_DIVE_MIN_SERMONS,
  deepDiveThresholdProse,
} from "@/lib/prep-card/deep-dive-threshold";
import type { EvaluationEntitlement, EvaluationUsage } from "./entitlement-types";
import {
  evaluationReturnNoteLines,
  subscriptionMonthRemaining,
} from "./return-note";

function usage(overrides: Partial<EvaluationUsage> = {}): EvaluationUsage {
  return {
    planTier: "coach",
    used: 1,
    limit: 10,
    periodStart: "2026-09-01",
    ...overrides,
  };
}

function entitlement(
  overrides: Partial<EvaluationEntitlement> = {},
): EvaluationEntitlement {
  return {
    freeRemaining: 0,
    packRemaining: 0,
    subscriptionActive: true,
    usage: usage(),
    canEvaluate: true,
    creditSource: "subscription",
    blockedReason: "none",
    ...overrides,
  };
}

describe("deep dive threshold", () => {
  it("is the single unlock count the close and the bar share", () => {
    assert.equal(DEEP_DIVE_MIN_SERMONS, 12);
    assert.equal(deepDiveThresholdProse("en"), "twelve");
    assert.equal(deepDiveThresholdProse("es"), "doce");
  });
});

describe("evaluation return note", () => {
  it("names the monthly remainder for a subscriber mid-month", () => {
    const lines = evaluationReturnNoteLines(entitlement());
    assert.deepEqual(lines, [
      "You have 9 evaluations left this month.",
      "Bring next week's manuscript back and we can tell you whether these three moved.",
      "This is one sermon. It cannot tell you how you consistently preach. At twelve, the patterns start showing up on their own.",
    ]);
  });

  it("uses the shared threshold in the last line", () => {
    const last = evaluationReturnNoteLines(entitlement()).at(-1);
    assert.ok(last);
    assert.match(last, new RegExp(`At ${deepDiveThresholdProse("en")},`));
  });

  it("speaks one and none as words", () => {
    assert.equal(
      evaluationReturnNoteLines(
        entitlement({ usage: usage({ used: 9 }) }),
      )[0],
      "You have one evaluation left this month.",
    );
    assert.equal(
      evaluationReturnNoteLines(
        entitlement({
          usage: usage({ used: 10 }),
          canEvaluate: false,
          creditSource: null,
          blockedReason: "monthly_limit",
        }),
      )[0],
      "You have no evaluations left this month.",
    );
  });

  it("counts a cohort month from that tier's limit", () => {
    assert.equal(
      subscriptionMonthRemaining(
        entitlement({
          usage: usage({ planTier: "cohort", used: 3, limit: 50 }),
        }),
      ),
      47,
    );
  });

  it("drops the month line when there is no active subscription", () => {
    const cases: EvaluationEntitlement[] = [
      entitlement({
        subscriptionActive: false,
        usage: null,
        freeRemaining: 1,
        creditSource: "free",
      }),
      entitlement({
        subscriptionActive: false,
        usage: null,
        freeRemaining: 0,
        packRemaining: 4,
        creditSource: "pack",
      }),
      entitlement({
        subscriptionActive: false,
        usage: null,
        canEvaluate: false,
        creditSource: null,
        blockedReason: "no_credits",
      }),
    ];

    for (const row of cases) {
      const lines = evaluationReturnNoteLines(row);
      assert.equal(lines.length, 2);
      assert.equal(subscriptionMonthRemaining(row), null);
      assert.doesNotMatch(lines[0], /this month/);
    }
  });

  it("drops the month line when the month is empty but another credit would still run", () => {
    const exhausted = entitlement({
      usage: usage({ used: 10 }),
      canEvaluate: true,
      creditSource: "pack",
      packRemaining: 2,
    });
    const freeStillWaiting = entitlement({
      usage: usage({ used: 10 }),
      canEvaluate: true,
      creditSource: "free",
      freeRemaining: 1,
    });

    assert.equal(subscriptionMonthRemaining(exhausted), null);
    assert.equal(subscriptionMonthRemaining(freeStillWaiting), null);
    assert.equal(evaluationReturnNoteLines(exhausted).length, 2);
  });

  it("does not fold free or pack credits into a month that still has room", () => {
    const row = entitlement({
      usage: usage({ used: 1 }),
      freeRemaining: 1,
      packRemaining: 3,
      creditSource: "free",
    });
    assert.equal(subscriptionMonthRemaining(row), 9);
    assert.equal(
      evaluationReturnNoteLines(row)[0],
      "You have 9 evaluations left this month.",
    );
  });

  it("omits the month line when entitlement failed to load", () => {
    const lines = evaluationReturnNoteLines(null);
    assert.equal(lines.length, 2);
    const last = lines.at(-1);
    assert.ok(last);
    assert.match(last, /At twelve,/);
  });

  it("translates the close without a second threshold", () => {
    const lines = evaluationReturnNoteLines(entitlement(), "es");
    assert.equal(lines[0], "Te quedan 9 evaluaciones este mes.");
    const last = lines.at(-1);
    assert.ok(last);
    assert.match(last, /A los doce,/);
    assert.equal(
      evaluationReturnNoteLines(
        entitlement({ usage: usage({ used: 9 }) }),
        "es",
      )[0],
      "Te queda una evaluación este mes.",
    );
  });
});
