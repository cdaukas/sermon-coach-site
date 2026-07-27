import { NextResponse } from "next/server";
import {
  MENTOR_INVITE_COOKIE,
  mentorAcceptPathWithToken,
  mentorInviteCookieOptions,
} from "@/lib/mentor/invite";
import { preferCanonicalOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

/**
 * Persist the invite token as an httpOnly cookie (same-browser fallback),
 * then send the user to signup or the consent screen. Cookie writes are not
 * allowed in Server Components — this route mirrors sketch claim staging.
 *
 * Production: cookie Domain=.sermoncoach.online so apex ↔ www both see it.
 * Signup redirects prefer www so emailRedirectTo matches Supabase Site URL.
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
    const signup = new URL("/signup", redirectOrigin);
    signup.searchParams.set("next", acceptPath);
    const unauthed = NextResponse.redirect(signup);
    unauthed.cookies.set(MENTOR_INVITE_COOKIE, token, cookieOpts);
    return unauthed;
  }

  const response = NextResponse.redirect(`${redirectOrigin}${acceptPath}`);
  response.cookies.set(MENTOR_INVITE_COOKIE, token, cookieOpts);
  return response;
}
