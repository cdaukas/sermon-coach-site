import { NextResponse } from "next/server";
import { clearMentorInviteCookie } from "@/lib/mentor/invite";

/**
 * Clear mentor_invite after accept succeeds or a definitive rejection.
 * Route Handler required — Server Components cannot modify cookies.
 * Mirrors sketch claim cookie clearing after claimSketchRead.
 */
export async function POST(request: Request) {
  const hostname = new URL(request.url).hostname;
  await clearMentorInviteCookie(hostname);
  return NextResponse.json({ ok: true });
}
