import {
  destinationForPostAuth,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
import { resolveConfirmNextPath } from "@/lib/auth/confirm-redirect";
import {
  claimSketchRead,
  claimTokenFromNextPath,
  resolveSketchClaimToken,
  SKETCH_CLAIM_COOKIE,
} from "@/lib/sketch/claim";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Server-side email confirmation via token_hash + verifyOtp.
 * No PKCE code_verifier — works cross-device.
 *
 * Coexists with /auth/callback (PKCE). Rollout:
 * 1. Ship this route (unused until template change).
 * 2. Confirm-signup template (dashboard), type=signup:
 *    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo | urlquery }}
 * 3. Keep /auth/callback for in-flight ConfirmationURL / PKCE emails.
 */

function loginFailureRedirect(origin: string, nextPath: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "auth_callback_failed");
  // Preserve claim/checkout destination — do not drop next on verify failure.
  url.searchParams.set("redirectTo", nextPath);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash")?.trim() || null;
  const type = searchParams.get("type")?.trim() || null;
  const next = resolveConfirmNextPath(searchParams.get("next"));

  if (!token_hash || !type) {
    return loginFailureRedirect(origin, next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash,
  });

  if (error) {
    return loginFailureRedirect(origin, next);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const jar = await cookies();
    const token = resolveSketchClaimToken(
      jar.get(SKETCH_CLAIM_COOKIE)?.value,
      searchParams.get("claim") ?? claimTokenFromNextPath(next),
    );
    if (token) {
      await claimSketchRead(user.id, token);
    }
  }

  const needsAttribution = await needsAcquisitionAttribution(supabase);
  const destination = destinationForPostAuth(next, needsAttribution);
  return NextResponse.redirect(`${origin}${destination}`);
}
