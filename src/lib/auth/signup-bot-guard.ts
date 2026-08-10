"use server";

import { isHeavyDottedGmail } from "@/lib/email/newsletter";

/** Same copy as newsletter subscribe invalid_email — do not reveal the rule. */
export const SIGNUP_INVALID_EMAIL_MESSAGE =
  "Please enter a valid email address";

export type SignupBotGateResult =
  | { ok: true }
  | { ok: false; error: "invalid_email"; message: string };

/**
 * Server-side bot gate for account signup. Client-only checks are bypassable
 * because signUp runs in the browser against Supabase Auth; this action runs
 * on the server before signUp is invoked.
 *
 * Rejects filled honeypot values and heavy-dotted Gmail (isHeavyDottedGmail).
 * Same generic invalid-email response as /api/newsletter/subscribe.
 *
 * Approach: server action (not email_available RPC) so we reuse the existing
 * TypeScript isHeavyDottedGmail predicate without duplicating it in SQL, and
 * so the honeypot can be enforced in the same request without a DB change.
 */
export async function assertSignupBotAllowed(
  email: string,
  websiteHoneypot: string,
): Promise<SignupBotGateResult> {
  const trap =
    typeof websiteHoneypot === "string" ? websiteHoneypot.trim() : "";
  if (trap.length > 0) {
    return {
      ok: false,
      error: "invalid_email",
      message: SIGNUP_INVALID_EMAIL_MESSAGE,
    };
  }

  const rawEmail = typeof email === "string" ? email : "";
  if (isHeavyDottedGmail(rawEmail)) {
    return {
      ok: false,
      error: "invalid_email",
      message: SIGNUP_INVALID_EMAIL_MESSAGE,
    };
  }

  return { ok: true };
}
