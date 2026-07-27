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

/**
 * Post-verify next path that carries a relative destination (e.g. mentor accept).
 * Mirrors startPathWithClaim: confirmation returns to /start with the payload
 * in the query string so /start can honor it before acquisition.
 */
export function startPathWithNext(nextPath: string): string {
  return `${START_PATH}?next=${encodeURIComponent(nextPath)}`;
}
