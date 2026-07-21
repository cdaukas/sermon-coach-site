import {
  destinationForPostAuth,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
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
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`,
  );
}
