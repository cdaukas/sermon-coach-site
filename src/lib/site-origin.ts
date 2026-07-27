/**
 * Canonical public origin for auth redirects and invite links.
 * Supabase Site URL is www; apex and www must not diverge or cookies / RedirectTo break.
 */

export const CANONICAL_SITE_HOST = "www.sermoncoach.online";
export const CANONICAL_SITE_ORIGIN = `https://${CANONICAL_SITE_HOST}`;
/** Leading-dot parent domain so cookies work on both apex and www. */
export const SITE_COOKIE_PARENT_DOMAIN = ".sermoncoach.online";

export function isSermonCoachProductionHost(hostname: string): boolean {
  return (
    hostname === "sermoncoach.online" || hostname === "www.sermoncoach.online"
  );
}

/**
 * Production public origin, normalized to www.
 * Localhost / 127.0.0.1 keep the current origin.
 */
export function publicSiteOrigin(
  hostname?: string | null,
  currentOrigin?: string | null,
): string {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    currentOrigin?.includes("localhost") ||
    currentOrigin?.includes("127.0.0.1")
  ) {
    return currentOrigin?.replace(/\/$/, "") || "http://127.0.0.1:3000";
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    try {
      const url = new URL(fromEnv);
      if (url.hostname === "sermoncoach.online") {
        url.hostname = CANONICAL_SITE_HOST;
      }
      return url.origin;
    } catch {
      /* fall through */
    }
  }

  return CANONICAL_SITE_ORIGIN;
}

/** Client-side: local keeps window origin; production always www. */
export function browserSiteOrigin(): string {
  if (typeof window === "undefined") return publicSiteOrigin();
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  return publicSiteOrigin(hostname, origin);
}

/**
 * Prefer www for production redirects so signup/confirm match Supabase Site URL.
 * Preview / local origins are unchanged.
 */
export function preferCanonicalOrigin(requestOrigin: string): string {
  try {
    const url = new URL(requestOrigin);
    if (url.hostname === "sermoncoach.online") {
      url.hostname = CANONICAL_SITE_HOST;
      return url.origin;
    }
    return url.origin;
  } catch {
    return requestOrigin;
  }
}
