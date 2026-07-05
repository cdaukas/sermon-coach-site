import { createHmac, timingSafeEqual } from "node:crypto";
import { BLOG_EMAIL_UNSUBSCRIBE_BASE_URL } from "./constants";

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
    .update(payload)
    .digest("base64url");
}

export function signUnsubscribeToken(email: string): string {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(normalized, "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
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
    return normalizeEmail(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email);
  return `${BLOG_EMAIL_UNSUBSCRIBE_BASE_URL}?token=${encodeURIComponent(token)}`;
}
