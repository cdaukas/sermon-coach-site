import { formatDeepDiveDay } from "./deep-dive-dashboard";

/** One successful prep card generation per rolling 30 days. */
export const PREP_CARD_GENERATION_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

/** Evaluated sermons required before a prep card can be built. */
export const PREP_CARD_MIN_EVALUATED_SERMONS = 4;

export function isPrepCardBelowMinimum(evaluatedSermonCount: number): boolean {
  return evaluatedSermonCount < PREP_CARD_MIN_EVALUATED_SERMONS;
}

export function prepCardEmptyLine(evaluatedSermonCount: number): string {
  return `Your prep card appears after ${PREP_CARD_MIN_EVALUATED_SERMONS} evaluated sermons. You have ${evaluatedSermonCount}.`;
}

export function prepCardNextAvailableAt(lastGeneratedAt: Date): Date {
  return new Date(lastGeneratedAt.getTime() + PREP_CARD_GENERATION_INTERVAL_MS);
}

export function isPrepCardGenerationLimited(
  lastGeneratedAt: Date | null,
  now: Date,
): boolean {
  if (!lastGeneratedAt) return false;
  return now.getTime() < prepCardNextAvailableAt(lastGeneratedAt).getTime();
}

export function prepCardLimitLine(availableOn: Date, now: Date): string {
  return `Your next prep card is available on ${formatDeepDiveDay(availableOn, now)}.`;
}
