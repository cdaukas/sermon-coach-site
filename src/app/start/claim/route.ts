import {
  claimSketchRead,
  resolveSketchClaimToken,
  SKETCH_CLAIM_COOKIE,
  SKETCH_CLAIM_OK_COOKIE,
} from "@/lib/sketch/claim";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Authenticated claim attach. Runs in a Route Handler so claim cookies can be
 * written (Server Components cannot set cookies). On success — or when confirm
 * already claimed and left sketch_claim_ok — redirect to /start?saved=1.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const claimParam = searchParams.get("claim");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", origin);
    const redirectTo = claimParam
      ? `/start?claim=${encodeURIComponent(claimParam)}`
      : "/start";
    login.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(login);
  }

  const jar = await cookies();
  const token = resolveSketchClaimToken(
    jar.get(SKETCH_CLAIM_COOKIE)?.value,
    claimParam,
  );
  const claimedNow = token ? await claimSketchRead(user.id, token) : false;
  const claimedViaConfirm = jar.get(SKETCH_CLAIM_OK_COOKIE)?.value === "1";

  console.error("start/claim result", {
    hasToken: Boolean(token),
    tokenPrefix: token?.slice(0, 8) ?? null,
    userId: user.id,
    claimedNow,
    claimedViaConfirm,
  });

  if (claimedNow || claimedViaConfirm) {
    return NextResponse.redirect(new URL("/start?saved=1", origin));
  }

  return NextResponse.redirect(new URL("/start?claim_miss=1", origin));
}
