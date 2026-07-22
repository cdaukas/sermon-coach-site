/** Auth-aware CTA landing — branches logged-in vs. new visitors. */
export const START_PATH = "/start";

/**
 * Where the attribution prompt sends users after continue/skip.
 * Stamps acquisition_source_at when still null (skip), then first eval.
 */
export const START_DESTINATION = "/start/continue";

/** First-eval page after attribution is resolved. */
export const FIRST_EVAL_PATH = "/dashboard/sermons/new";

/** Post-verify next path that carries a Sketch claim token as fallback. */
export function startPathWithClaim(token: string): string {
  return `${START_PATH}?claim=${encodeURIComponent(token)}`;
}
