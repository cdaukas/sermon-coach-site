"use server";

import {
  checkSignupBotGate,
  type SignupBotGateResult,
} from "@/lib/auth/signup-bot-gate";

/**
 * Server-side bot gate for account signup. Client-only checks are bypassable
 * because signUp runs in the browser against Supabase Auth; this action runs
 * on the server before signUp is invoked.
 *
 * Approach: server action (not email_available RPC) so we reuse the existing
 * TypeScript isHeavyDottedGmail predicate without duplicating it in SQL, and
 * so the honeypot can be enforced in the same request without a DB change.
 *
 * Only async exports live in this file ("use server" modules cannot export
 * constants/types for client import graphs).
 */
export async function assertSignupBotAllowed(
  email: string,
  websiteHoneypot: string,
): Promise<SignupBotGateResult> {
  return checkSignupBotGate(email, websiteHoneypot);
}
