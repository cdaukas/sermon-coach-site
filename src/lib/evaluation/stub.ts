/**
 * Fixture eval path — dev only. Never honored on Vercel production.
 */
export function isEvaluationStubEnabled(): boolean {
  if (process.env.EVALUATION_USE_STUB !== "1") {
    return false;
  }

  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  return true;
}
