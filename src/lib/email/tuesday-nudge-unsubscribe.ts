import { createHmac, timingSafeEqual } from "node:crypto";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

const TOKEN_PURPOSE = "tuesday-nudge";

export const TUESDAY_NUDGE_UNSUBSCRIBE_PATH = "/unsubscribe/tuesday-nudge";

function getUnsubscribeSecret(): string {
  const secret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error(
      "EMAIL_UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY is required for unsubscribe tokens.",
    );
  }

  return secret;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signPayload(payload: string): string {
  return createHmac("sha256", getUnsubscribeSecret())
    .update(TOKEN_PURPOSE)
    .update(payload)
    .digest("base64url");
}

export function signTuesdayNudgeUnsubscribeToken(email: string): string {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(normalized, "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyTuesdayNudgeUnsubscribeToken(
  token: string,
): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (sigBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const email = normalizeEmail(Buffer.from(payload, "base64url").toString("utf8"));
    if (!email.includes("@")) {
      return null;
    }
    return email;
  } catch {
    return null;
  }
}

export function buildTuesdayNudgeUnsubscribeUrl(email: string): string {
  const token = signTuesdayNudgeUnsubscribeToken(email);
  return `${CANONICAL_SITE_ORIGIN}${TUESDAY_NUDGE_UNSUBSCRIBE_PATH}?token=${encodeURIComponent(token)}`;
}
