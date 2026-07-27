import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  MENTOR_INVITE_COOKIE,
  mentorAcceptPathWithToken,
  mentorInviteCookieOptions,
} from "@/lib/mentor/invite";
import { createClient } from "@/lib/supabase/server";

/**
 * Persist the invite token as an httpOnly cookie (same-browser fallback),
 * then send the user to signup or the consent screen. Cookie writes are not
 * allowed in Server Components — this route mirrors sketch claim staging.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token")?.trim() || null;

  if (!token) {
    return NextResponse.redirect(`${origin}/mentor/accept`);
  }

  const acceptPath = mentorAcceptPathWithToken(token);
  const response = NextResponse.redirect(`${origin}${acceptPath}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signup = new URL("/signup", origin);
    signup.searchParams.set("next", acceptPath);
    const unauthed = NextResponse.redirect(signup);
    unauthed.cookies.set(
      MENTOR_INVITE_COOKIE,
      token,
      mentorInviteCookieOptions(),
    );
    return unauthed;
  }

  response.cookies.set(
    MENTOR_INVITE_COOKIE,
    token,
    mentorInviteCookieOptions(),
  );
  return response;
}
