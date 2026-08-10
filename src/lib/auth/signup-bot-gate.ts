import { isHeavyDottedGmail } from "@/lib/email/newsletter";

/** Same copy as newsletter subscribe invalid_email — do not reveal the rule. */
export const SIGNUP_INVALID_EMAIL_MESSAGE =
  "Please enter a valid email address";

export type SignupBotGateResult =
  | { ok: true }
  | { ok: false; error: "invalid_email"; message: string };

/**
 * Pure bot gate for account signup (shared by the server action and tests).
 * Rejects filled honeypot values and heavy-dotted Gmail (isHeavyDottedGmail).
 */
export function checkSignupBotGate(
  email: string,
  websiteHoneypot: string,
): SignupBotGateResult {
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
