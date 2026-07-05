import type { SupabaseClient } from "@supabase/supabase-js";

export type BlogRecipientRow = {
  userId: string | null;
  email: string;
};

/** Chris internal test/demo accounts — excluded from real list sends. */
export function isInternalTestAccount(email: string): boolean {
  const normalized = email.trim().toLowerCase();

  if (normalized === "cdaukas@gmail.com") {
    return true;
  }

  return /^cdaukas\+[^@]+@gmail\.com$/.test(normalized);
}

export function applyInternalAccountFilter(
  recipients: BlogRecipientRow[],
): { eligible: BlogRecipientRow[]; internalExcludedCount: number } {
  const eligible: BlogRecipientRow[] = [];
  let internalExcludedCount = 0;

  for (const recipient of recipients) {
    if (isInternalTestAccount(recipient.email)) {
      internalExcludedCount += 1;
      continue;
    }
    eligible.push(recipient);
  }

  return { eligible, internalExcludedCount };
}

/**
 * Broadest audience: every auth.users row with an email.
 * profiles.id = auth.users.id (1:1 via on_auth_user_created trigger) — no tier filter.
 */
export async function listAllAccountEmails(
  supabase: SupabaseClient,
): Promise<BlogRecipientRow[]> {
  const rows: BlogRecipientRow[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    }

    for (const user of data.users) {
      const email = user.email?.trim();
      if (!email) {
        continue;
      }

      rows.push({
        userId: user.id,
        email: email.toLowerCase(),
      });
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  const byEmail = new Map<string, BlogRecipientRow>();
  for (const row of rows) {
    byEmail.set(row.email, row);
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function listNewsletterSubscriberEmails(
  supabase: SupabaseClient,
): Promise<BlogRecipientRow[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email");

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.code === "PGRST205"
    ) {
      console.warn(
        "newsletter_subscribers table not found — treating newsletter list as empty. Apply migration 20260706120000_newsletter_subscribers.sql.",
      );
      return [];
    }

    throw new Error(`newsletter_subscribers query failed: ${error.message}`);
  }

  const byEmail = new Map<string, BlogRecipientRow>();
  for (const row of data ?? []) {
    const email = String(row.email).trim().toLowerCase();
    if (!email) {
      continue;
    }
    byEmail.set(email, { userId: null, email });
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** Dedupe by normalized email; auth.users rows win over newsletter-only rows. */
export function mergeRecipientSources(
  accountRecipients: BlogRecipientRow[],
  newsletterRecipients: BlogRecipientRow[],
): BlogRecipientRow[] {
  const byEmail = new Map<string, BlogRecipientRow>();

  for (const recipient of newsletterRecipients) {
    byEmail.set(recipient.email, recipient);
  }

  for (const recipient of accountRecipients) {
    byEmail.set(recipient.email, recipient);
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function loadSuppressedEmails(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("email_suppressions")
    .select("email");

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.code === "PGRST205"
    ) {
      console.warn(
        "email_suppressions table not found — treating suppressions as empty. Apply migration 20260705120000_email_suppressions.sql before a real send.",
      );
      return new Set();
    }

    throw new Error(`email_suppressions query failed: ${error.message}`);
  }

  return new Set(
    (data ?? []).map((row) => String(row.email).trim().toLowerCase()),
  );
}

export function applySuppressionFilter(
  recipients: BlogRecipientRow[],
  suppressed: Set<string>,
): { eligible: BlogRecipientRow[]; suppressedCount: number } {
  const eligible: BlogRecipientRow[] = [];
  let suppressedCount = 0;

  for (const recipient of recipients) {
    if (suppressed.has(recipient.email)) {
      suppressedCount += 1;
      continue;
    }
    eligible.push(recipient);
  }

  return { eligible, suppressedCount };
}

export async function resolveEligibleBlogRecipients(
  supabase: SupabaseClient,
): Promise<{
  totalAccounts: number;
  totalNewsletterSubscribers: number;
  totalUniqueRecipients: number;
  internalExcludedCount: number;
  suppressedCount: number;
  eligible: BlogRecipientRow[];
}> {
  const [accounts, newsletter] = await Promise.all([
    listAllAccountEmails(supabase),
    listNewsletterSubscriberEmails(supabase),
  ]);
  const merged = mergeRecipientSources(accounts, newsletter);
  const { eligible: afterInternal, internalExcludedCount } =
    applyInternalAccountFilter(merged);
  const suppressed = await loadSuppressedEmails(supabase);
  const { eligible, suppressedCount } = applySuppressionFilter(
    afterInternal,
    suppressed,
  );

  return {
    totalAccounts: accounts.length,
    totalNewsletterSubscribers: newsletter.length,
    totalUniqueRecipients: merged.length,
    internalExcludedCount,
    suppressedCount,
    eligible,
  };
}
