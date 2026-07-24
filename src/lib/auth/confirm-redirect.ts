/** Hosts allowed when unwrapping emailRedirectTo from the confirm link. */
const ALLOWED_REDIRECT_HOSTS = new Set([
  "www.sermoncoach.online",
  "sermoncoach.online",
]);

/**
 * Relative post-auth path only. Absolute URLs and protocol-relative
 * paths are rejected — do not loosen this for token_hash unwrap.
 */
export function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

/**
 * emailRedirectTo stays pointed at /auth/callback?next=<path> so in-flight
 * PKCE emails keep working. The token_hash template passes that full URL as
 * `next`; unwrap the inner relative path for safeRedirectPath.
 */
export function unwrapAuthCallbackNext(
  rawNext: string | null | undefined,
): string | null {
  if (!rawNext?.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawNext.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_REDIRECT_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const inner = parsed.searchParams.get("next")?.trim();
  if (inner) return inner;

  return `${parsed.pathname}${parsed.search}` || null;
}

/** Resolve the relative destination carried through the confirm email link. */
export function resolveConfirmNextPath(
  rawNext: string | null | undefined,
): string {
  return safeRedirectPath(unwrapAuthCallbackNext(rawNext));
}
