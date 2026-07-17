import {
  destinationForPostAuth,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
import { createClient } from "@/lib/supabase/server";
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
      const needsAttribution = await needsAcquisitionAttribution(supabase);
      const destination = destinationForPostAuth(next, needsAttribution);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`,
  );
}
