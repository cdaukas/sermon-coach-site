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
 * Browser URL that lands an unauthenticated visitor on /start while carrying a
 * relative destination (mentor accept). Used only for the page URL after
 * /mentor/accept/carry — not for emailRedirectTo.
 *
 * Do not nest this path again into emailRedirectTo. Each hop that calls
 * encodeURIComponent turns / into %2F, then %252F, then %25252F; the third
 * layer has produced Supabase auth signup 500s on production (invite path).
 */
export function startPathWithNext(nextPath: string): string {
  return `${START_PATH}?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Relative path passed as emailRedirectTo /auth/callback?next=… after /start
 * signup. Mentor accept is kept flat (like coach checkout), not re-wrapped in
 * /start?next=. Sketch claim stays /start?claim=.
 */
export function emailRedirectNextPath(options: {
  inviteNext?: string | null;
  claimToken?: string | null;
}): string {
  if (options.inviteNext) {
    return options.inviteNext;
  }
  if (options.claimToken) {
    return startPathWithClaim(options.claimToken);
  }
  return START_PATH;
}
