const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NEWSLETTER_SOURCES = [
  "blog_footer",
  "blog_post_inline",
  "homepage",
  "pricing",
  "faq",
  "terms",
  "privacy",
  "story",
  "how_its_scored",
  "unknown",
] as const;

export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

/**
 * Full parity with public.normalize_email (SQL):
 * - gmail.com / googlemail.com: lower, strip +tag, remove all dots, map → @gmail.com
 * - other domains: lower, strip +tag, keep dots
 */
export function normalizeNewsletterEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return trimmed;
  }

  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus !== -1) {
    local = local.slice(0, plus);
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.replace(/\./g, "")}@gmail.com`;
  }

  return `${local}@${domain}`;
}

/**
 * Heavy-dotted Gmail bot signature: 4+ dots in the local part *before*
 * Gmail/dot normalization. Checked on the trimmed/lowercased input only.
 */
export function isHeavyDottedGmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return false;
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (domain !== "gmail.com" && domain !== "googlemail.com") {
    return false;
  }

  const dots = local.match(/\./g);
  return (dots?.length ?? 0) >= 4;
}

export function isValidNewsletterEmail(email: string): boolean {
  const normalized = normalizeNewsletterEmail(email);
  return (
    normalized.length > 0 &&
    normalized.length <= 254 &&
    EMAIL_PATTERN.test(normalized)
  );
}

export function parseNewsletterSource(value: unknown): NewsletterSource {
  if (typeof value !== "string") {
    return "unknown";
  }

  const trimmed = value.trim().toLowerCase();
  return (NEWSLETTER_SOURCES as readonly string[]).includes(trimmed)
    ? (trimmed as NewsletterSource)
    : "unknown";
}
