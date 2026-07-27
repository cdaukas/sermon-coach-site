import {
  destinationForPostAuth,
  isDashboardPath,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
import {
  MENTOR_INVITE_COOKIE,
  mentorAcceptPathWithToken,
  mentorTokenFromNextPath,
} from "@/lib/mentor/invite";
import { START_PATH } from "@/lib/auth/start";
import {
  claimSketchRead,
  claimTokenFromNextPath,
  resolveSketchClaimToken,
  SKETCH_CLAIM_COOKIE,
} from "@/lib/sketch/claim";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

/** When confirm drops the accept URL but the cookie remains, prefer consent. */
function destinationWithMentorInvite(
  destination: string,
  cookieToken: string | undefined | null,
  nextPath: string,
): string {
  if (destination.startsWith("/mentor/accept")) return destination;
  const token =
    cookieToken?.trim() || mentorTokenFromNextPath(nextPath) || null;
  if (!token) return destination;
  if (destination === START_PATH || isDashboardPath(destination)) {
    return mentorAcceptPathWithToken(token);
  }
  return destination;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const jar = await cookies();
      if (user) {
        const token = resolveSketchClaimToken(
          jar.get(SKETCH_CLAIM_COOKIE)?.value,
          searchParams.get("claim") ?? claimTokenFromNextPath(next),
        );
        if (token) {
          await claimSketchRead(user.id, token);
        }
      }

      const needsAttribution = await needsAcquisitionAttribution(supabase);
      const destination = destinationWithMentorInvite(
        destinationForPostAuth(next, needsAttribution),
        jar.get(MENTOR_INVITE_COOKIE)?.value,
        next,
      );
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`,
  );
}
