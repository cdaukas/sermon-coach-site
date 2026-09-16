import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/**
 * RFC 8058 one-click unsubscribe. Gmail/Yahoo POST here with no session.
 * Humans should use /unsubscribe (page.tsx); GET on this path redirects there.
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return new NextResponse(null, { status: 400 });
  }

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("email_suppressions").upsert(
    {
      email,
      reason: "unsubscribe",
      unsubscribed_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const redirectUrl = new URL("/unsubscribe", requestUrl.origin);
  if (token) {
    redirectUrl.searchParams.set("token", token);
  }
  return NextResponse.redirect(redirectUrl, 302);
}
