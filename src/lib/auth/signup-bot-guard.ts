"use server";

import { headers } from "next/headers";
import {
  checkSignupBotGate,
  SIGNUP_INVALID_EMAIL_MESSAGE,
  type SignupBotGateResult,
} from "@/lib/auth/signup-bot-gate";
import {
  SIGNUP_MAX_PER_DAY,
  SIGNUP_MAX_PER_HOUR,
  clientIpFromForwardedFor,
  startOfUtcDayIso,
} from "@/lib/auth/signup-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side bot gate for account signup. Client-only checks are bypassable
 * because signUp runs in the browser against Supabase Auth; this action runs
 * on the server before signUp is invoked.
 *
 * Only async exports live in this file ("use server" modules cannot export
 * constants/types for client import graphs).
 */

const INVALID_EMAIL: SignupBotGateResult = {
  ok: false,
  error: "invalid_email",
  message: SIGNUP_INVALID_EMAIL_MESSAGE,
};

async function resolveSignupClientIp(): Promise<string | null> {
  const headerList = await headers();
  return clientIpFromForwardedFor(headerList.get("x-forwarded-for"));
}

/**
 * Returns true if signup may proceed. Fail open on query errors or null IP.
 * Does not record — caller records only after a full gate pass.
 */
async function isSignupRateAllowed(ip: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const hourSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayStart = startOfUtcDayIso();

    const { count: hourCount, error: hourError } = await supabase
      .from("signup_rate_events")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", hourSince);

    if (hourError || hourCount == null) {
      console.warn("signup_rate_events hour count failed", hourError);
      return true;
    }
    if (hourCount >= SIGNUP_MAX_PER_HOUR) {
      return false;
    }

    const { count: dayCount, error: dayError } = await supabase
      .from("signup_rate_events")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", dayStart);

    if (dayError || dayCount == null) {
      console.warn("signup_rate_events day count failed", dayError);
      return true;
    }
    if (dayCount >= SIGNUP_MAX_PER_DAY) {
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      "signup rate check failed:",
      err instanceof Error ? err.message : String(err),
    );
    return true;
  }
}

async function recordSignupRateEvent(ip: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("signup_rate_events").insert({ ip });
    if (error) {
      console.warn("signup_rate_events insert failed:", error.message);
    }
  } catch (err) {
    console.warn(
      "signup_rate_events insert threw:",
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

  const ip = await resolveSignupClientIp();
  if (ip == null) {
    // Fail open: missing IP header must never block every signup.
    return result;
  }

  const allowed = await isSignupRateAllowed(ip);
  if (!allowed) {
    return INVALID_EMAIL;
  }

  await recordSignupRateEvent(ip);
  return result;
}
