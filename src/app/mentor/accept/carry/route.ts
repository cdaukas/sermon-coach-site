import { NextResponse } from "next/server";
import { startPathWithNext } from "@/lib/auth/start";
import {
  MENTOR_INVITE_COOKIE,
  mentorAcceptPathWithToken,
  mentorInviteCookieOptions,
} from "@/lib/mentor/invite";
import { preferCanonicalOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

/**
 * Persist the invite token as an httpOnly cookie (same-browser fallback),
 * then send the user to /start with next= (page URL only; mirrors sketch claim).
 * Cookie writes are not allowed in Server Components.
 *
 * Production: cookie Domain=.sermoncoach.online so apex ↔ www both see it.
 * StartLanding puts the *inner* accept path into emailRedirectTo flat — do not
 * nest /start?next= again into callback next (that over-encodes and can 500).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const hostname = new URL(request.url).hostname;
  const token = searchParams.get("token")?.trim() || null;

  if (!token) {
    return NextResponse.redirect(`${preferCanonicalOrigin(origin)}/mentor/accept`);
  }

  const acceptPath = mentorAcceptPathWithToken(token);
  const cookieOpts = mentorInviteCookieOptions(undefined, hostname);
  const redirectOrigin = preferCanonicalOrigin(origin);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Mirror sketch: unauthed visitors sign up on /start with the payload in the query.
    const startUrl = `${redirectOrigin}${startPathWithNext(acceptPath)}`;
    const unauthed = NextResponse.redirect(startUrl);
    unauthed.cookies.set(MENTOR_INVITE_COOKIE, token, cookieOpts);
    return unauthed;
  }

  const response = NextResponse.redirect(`${redirectOrigin}${acceptPath}`);
  response.cookies.set(MENTOR_INVITE_COOKIE, token, cookieOpts);
  return response;
}
