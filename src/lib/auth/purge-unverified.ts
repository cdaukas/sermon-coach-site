import { normalizeNewsletterEmail } from "@/lib/email/newsletter";

export const DEFAULT_UNVERIFIED_PURGE_ALLOWLIST = ["cdaukas@gmail.com"];

export const UNVERIFIED_PURGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthUserLike = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  created_at: string;
};

export function parseUnverifiedPurgeAllowlist(
  extraCsv: string | undefined,
  defaults: readonly string[] = DEFAULT_UNVERIFIED_PURGE_ALLOWLIST,
): string[] {
  const extras = (extraCsv ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const merged = [...defaults, ...extras].map((email) =>
    normalizeNewsletterEmail(email),
  );
  return [...new Set(merged)];
}

export function isUnverifiedPurgeAllowlisted(
  email: string,
  allowlist: readonly string[],
): boolean {
  const normalized = normalizeNewsletterEmail(email);
  return allowlist.includes(normalized);
}

export function isStaleUnverifiedUser(
  user: AuthUserLike,
  nowMs: number,
  maxAgeMs: number = UNVERIFIED_PURGE_MAX_AGE_MS,
): boolean {
  if (user.email_confirmed_at) {
    return false;
  }
  if (user.last_sign_in_at) {
    return false;
  }
  const email = user.email?.trim() ?? "";
  if (!email) {
    return false;
  }
  const created = Date.parse(user.created_at);
  if (!Number.isFinite(created)) {
    return false;
  }
  return nowMs - created >= maxAgeMs;
}

export function selectUnverifiedPurgeCandidates(
  users: AuthUserLike[],
  options: {
    nowMs?: number;
    maxAgeMs?: number;
    allowlist?: readonly string[];
  } = {},
): {
  candidates: AuthUserLike[];
  skippedAllowlist: AuthUserLike[];
} {
  const nowMs = options.nowMs ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? UNVERIFIED_PURGE_MAX_AGE_MS;
  const allowlist = options.allowlist ?? DEFAULT_UNVERIFIED_PURGE_ALLOWLIST;
  const candidates: AuthUserLike[] = [];
  const skippedAllowlist: AuthUserLike[] = [];

  for (const user of users) {
    if (!isStaleUnverifiedUser(user, nowMs, maxAgeMs)) {
      continue;
    }
    const email = user.email?.trim() ?? "";
    if (isUnverifiedPurgeAllowlisted(email, allowlist)) {
      skippedAllowlist.push(user);
      continue;
    }
    candidates.push(user);
  }

  return { candidates, skippedAllowlist };
}
