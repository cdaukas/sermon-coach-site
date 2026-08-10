"use server";

import { headers } from "next/headers";
import {
  checkSignupBotGate,
  type SignupBotGateResult,
} from "@/lib/auth/signup-bot-gate";
import { createAdminClient } from "@/lib/supabase/admin";

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

/** Temporary: observe which IP headers appear during a server-action signup gate. */
async function recordSignupIpProbe(): Promise<void> {
  try {
    const headerList = await headers();
    const headerNames: string[] = [];
    headerList.forEach((_value, name) => {
      headerNames.push(name);
    });
    headerNames.sort();

    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const vercelIp = headerList.get("x-vercel-forwarded-for");

    const supabase = createAdminClient();
    const { error } = await supabase.from("signup_ip_probe").insert({
      forwarded_for: forwardedFor,
      real_ip: realIp,
      vercel_ip: vercelIp,
      header_names: headerNames,
    });

    if (error) {
      console.warn("signup_ip_probe insert failed:", error.message);
    }
  } catch (err) {
    console.warn(
      "signup_ip_probe failed:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function assertSignupBotAllowed(
  email: string,
  websiteHoneypot: string,
): Promise<SignupBotGateResult> {
  const result = checkSignupBotGate(email, websiteHoneypot);
  if (!result.ok) {
    return result;
  }

  // Observe only — never block signup if the probe fails.
  await recordSignupIpProbe();

  return result;
}
