/**
 * Canonical public origin for auth redirects and invite links.
 * Supabase Site URL is https://sermoncoach.com (apex). Other hostnames 308 here.
 */

export const CANONICAL_SITE_HOST = "sermoncoach.com";
export const CANONICAL_SITE_ORIGIN = `https://${CANONICAL_SITE_HOST}`;
/** Leading-dot parent domain so cookies work on both apex and www. */
export const SITE_COOKIE_PARENT_DOMAIN = ".sermoncoach.com";

const HOSTS_REWRITTEN_TO_CANONICAL = new Set([
  "www.sermoncoach.com",
  "sermoncoach.online",
  "www.sermoncoach.online",
]);

export function isSermonCoachProductionHost(hostname: string): boolean {
  return hostname === "sermoncoach.com" || hostname === "www.sermoncoach.com";
}

function rewriteToCanonicalOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (HOSTS_REWRITTEN_TO_CANONICAL.has(url.hostname)) {
      url.hostname = CANONICAL_SITE_HOST;
      return url.origin;
    }
    return url.origin;
  } catch {
    return origin;
  }
}

/**
 * Production public origin, normalized to apex.
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
    return rewriteToCanonicalOrigin(fromEnv);
  }

  return CANONICAL_SITE_ORIGIN;
}

/** Client-side: local keeps window origin; production always apex. */
export function browserSiteOrigin(): string {
  if (typeof window === "undefined") return publicSiteOrigin();
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  return publicSiteOrigin(hostname, origin);
}

/**
 * Prefer apex for production redirects so signup/confirm match Supabase Site URL.
 * Preview / local origins are unchanged.
 */
export function preferCanonicalOrigin(requestOrigin: string): string {
  return rewriteToCanonicalOrigin(requestOrigin);
}
