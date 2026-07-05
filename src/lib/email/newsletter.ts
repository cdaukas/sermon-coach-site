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

export function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string): boolean {
  const normalized = normalizeNewsletterEmail(email);
  return normalized.length > 0 && normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
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
