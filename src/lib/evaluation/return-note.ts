import { deepDiveThresholdProse } from "@/lib/prep-card/deep-dive-threshold";
import type { EvaluationEntitlement } from "./entitlement-types";
import type { OutputLanguage } from "./output-language";

/**
 * Closing lines after the three practical steps.
 *
 * Line 1 is the subscriber's remaining monthly evaluations. It is omitted
 * when that sentence would be false:
 * - no active subscription (free credit, pack-only, lapsed, comped without
 *   an active plan) — there is no monthly allowance to count
 * - the month is used up but a free or pack credit would still run
 *
 * There is no unlimited evaluation tier. A comped account is not one:
 * complimentary Coach is a billing flag, and the monthly count appears
 * only when subscription_status is active, same as any subscriber.
 *
 * Lines 2 and 3 are fixed. Line 3 takes the deep-dive sermon threshold
 * from deep-dive-threshold.ts.
 */
export function evaluationReturnNoteLines(
  entitlement: EvaluationEntitlement | null,
  language: OutputLanguage = "en",
): readonly [string, string] | readonly [string, string, string] {
  const month = monthlyRemainingLine(entitlement, language);
  const fixed = fixedReturnLines(language);
  return month ? [month, fixed[0], fixed[1]] : fixed;
}

function monthlyRemainingLine(
  entitlement: EvaluationEntitlement | null,
  language: OutputLanguage,
): string | null {
  const remaining = subscriptionMonthRemaining(entitlement);
  if (remaining === null) {
    return null;
  }
  return formatMonthRemaining(remaining, language);
}

/**
 * Remaining evaluations on the active monthly allowance.
 * Null when that allowance is not what the sentence can honestly name.
 */
export function subscriptionMonthRemaining(
  entitlement: EvaluationEntitlement | null,
): number | null {
  if (!entitlement?.subscriptionActive || !entitlement.usage) {
    return null;
  }

  const { limit, used } = entitlement.usage;
  if (!Number.isFinite(limit) || !Number.isFinite(used)) {
    return null;
  }

  const remaining = limit - used;
  if (remaining <= 0) {
    if (entitlement.freeRemaining > 0 || entitlement.packRemaining > 0) {
      return null;
    }
    return 0;
  }

  return remaining;
}

function formatMonthRemaining(
  remaining: number,
  language: OutputLanguage,
): string {
  if (language === "es") {
    if (remaining === 0) {
      return "No te quedan evaluaciones este mes.";
    }
    if (remaining === 1) {
      return "Te queda una evaluación este mes.";
    }
    return `Te quedan ${remaining} evaluaciones este mes.`;
  }

  if (remaining === 0) {
    return "You have no evaluations left this month.";
  }
  if (remaining === 1) {
    return "You have one evaluation left this month.";
  }
  return `You have ${remaining} evaluations left this month.`;
}

function fixedReturnLines(
  language: OutputLanguage,
): readonly [string, string] {
  const threshold = deepDiveThresholdProse(language);
  if (language === "es") {
    return [
      "Trae el manuscrito de la próxima semana y podremos decirte si estos tres se movieron.",
      `Este es un sermón. No puede decirte cómo predicas de manera constante. A los ${threshold}, los patrones empiezan a mostrarse solos.`,
    ];
  }

  return [
    "Bring next week's manuscript back and we can tell you whether these three moved.",
    `This is one sermon. It cannot tell you how you consistently preach. At ${threshold}, the patterns start showing up on their own.`,
  ];
}
