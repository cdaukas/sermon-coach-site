/** Mentor invite token survival + accept result helpers.
 *  Mirrors the sketch claim pattern: token in the post-auth `next` path,
 *  with an httpOnly cookie as same-browser fallback. /start reads the cookie
 *  when the URL destination is lost (same safety net as sketch_claim).
 */

import {
  isSermonCoachProductionHost,
  SITE_COOKIE_PARENT_DOMAIN,
} from "@/lib/site-origin";

export const MENTOR_INVITE_COOKIE = "mentor_invite";

export const MENTOR_ACCEPT_PATH = "/mentor/accept";
export const MENTOR_INVITE_PATH = "/mentor/invite";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

/** Same-browser fallback; email `next` path is the cross-device credential. */
const INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AcceptMentorInviteErrorCode =
  | "not_authenticated"
  | "invalid_or_used"
  | "self_invite"
  | "already_mentored";

export type AcceptMentorInviteResult = {
  ok: boolean;
  error_code: AcceptMentorInviteErrorCode | null;
  relationship_id: string | null;
};

export function mentorInviteCookieOptions(
  maxAge = INVITE_COOKIE_MAX_AGE_SECONDS,
  hostname?: string | null,
) {
  const options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
    domain?: string;
  } = { ...COOKIE_OPTIONS, maxAge };

  // Scope to parent domain so apex-set cookies are visible on www (Site URL)
  // and vice versa. Omit on localhost — Domain must match the request host.
  if (hostname && isSermonCoachProductionHost(hostname)) {
    options.domain = SITE_COOKIE_PARENT_DOMAIN;
  }

  return options;
}

/** Clear after accept succeeds or a definitive RPC rejection (mirrors sketch claim). */
export async function clearMentorInviteCookie(
  hostname?: string | null,
): Promise<void> {
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    jar.set(MENTOR_INVITE_COOKIE, "", mentorInviteCookieOptions(0, hostname));
  } catch (err) {
    console.error("clearMentorInviteCookie failed", err);
  }
}

/** Resolve invite token: ?token= query param first, then httpOnly cookie fallback.
 *  Query wins so a fresh invite link is not overridden by a stale cookie.
 */
export function resolveMentorInviteToken(
  cookieToken: string | undefined | null,
  tokenParam: string | undefined | null,
): string | null {
  const fromParam = tokenParam?.trim();
  if (fromParam) return fromParam;
  const fromCookie = cookieToken?.trim();
  if (fromCookie) return fromCookie;
  return null;
}

export function mentorAcceptPathWithToken(token: string): string {
  return `${MENTOR_ACCEPT_PATH}?token=${encodeURIComponent(token)}`;
}

export function mentorAcceptCarryPath(token: string): string {
  return `${MENTOR_ACCEPT_PATH}/carry?token=${encodeURIComponent(token)}`;
}

/** Extract ?token= from a next path such as `/mentor/accept?token=<token>`,
 *  or from a nested `/start?next=/mentor/accept?token=<token>` (post-confirm shape).
 */
export function mentorTokenFromNextPath(nextPath: string): string | null {
  try {
    const url = new URL(nextPath, "https://placeholder.local");
    if (url.pathname === MENTOR_ACCEPT_PATH) {
      return url.searchParams.get("token")?.trim() || null;
    }
    if (url.pathname === "/start") {
      const nested = url.searchParams.get("next")?.trim();
      if (!nested) return null;
      return mentorTokenFromNextPath(nested);
    }
    return null;
  } catch {
    return null;
  }
}

export function messageForAcceptError(
  code: AcceptMentorInviteErrorCode | string | null | undefined,
): string {
  switch (code) {
    case "invalid_or_used":
      return "This invitation link is invalid or has already been used.";
    case "self_invite":
      return "You can't accept your own invitation.";
    case "already_mentored":
      return "You're already in a mentoring relationship. You can only have one mentor at a time.";
    case "not_authenticated":
      return "Sign in to accept this invitation.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function parseAcceptMentorInviteResult(
  data: unknown,
): AcceptMentorInviteResult {
  if (!data || typeof data !== "object") {
    return { ok: false, error_code: null, relationship_id: null };
  }
  const row = data as Record<string, unknown>;
  const ok = row.ok === true;
  const error_code =
    typeof row.error_code === "string"
      ? (row.error_code as AcceptMentorInviteErrorCode)
      : null;
  const relationship_id =
    typeof row.relationship_id === "string" ? row.relationship_id : null;
  return { ok, error_code, relationship_id };
}
