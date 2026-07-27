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

/** Domains that are never real newsletter recipients (fixtures / SMS gateways). */
export const TEST_FIXTURE_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "vtext.com",
  "txt.att.net",
  "tmomail.net",
  "msg.fi.google.com",
] as const;

/** Local-part prefixes used by automated test fixtures (any domain). */
export const TEST_FIXTURE_LOCAL_PREFIXES = [
  "sketch-",
  "acq-",
  "rr-",
] as const;

/** Plus-tag local-part prefix used for Chris test addresses (any domain). */
export const TEST_FIXTURE_PLUS_TAG_PREFIX = "cdaukas+";

/**
 * Returns the first matching fixture rule key, or null.
 * Domain rules win over local-prefix rules; plus-tag is last.
 */
export function matchTestFixtureRule(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) {
    return null;
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  for (const fixtureDomain of TEST_FIXTURE_DOMAINS) {
    if (domain === fixtureDomain) {
      return fixtureDomain;
    }
  }

  for (const prefix of TEST_FIXTURE_LOCAL_PREFIXES) {
    if (local.startsWith(prefix)) {
      return prefix;
    }
  }

  if (local.startsWith(TEST_FIXTURE_PLUS_TAG_PREFIX)) {
    return TEST_FIXTURE_PLUS_TAG_PREFIX;
  }

  return null;
}

/** Test-fixture / SMS-gateway addresses — excluded from real list sends. */
export function isTestFixtureAccount(email: string): boolean {
  return matchTestFixtureRule(email) !== null;
}

export function applyTestFixtureFilter(
  recipients: BlogRecipientRow[],
): {
  eligible: BlogRecipientRow[];
  fixtureExcludedCount: number;
  fixtureExcludedByRule: Record<string, string[]>;
} {
  const eligible: BlogRecipientRow[] = [];
  const fixtureExcludedByRule: Record<string, string[]> = {};
  let fixtureExcludedCount = 0;

  for (const recipient of recipients) {
    const rule = matchTestFixtureRule(recipient.email);
    if (rule) {
      fixtureExcludedCount += 1;
      const bucket = fixtureExcludedByRule[rule] ?? [];
      bucket.push(recipient.email);
      fixtureExcludedByRule[rule] = bucket;
      continue;
    }
    eligible.push(recipient);
  }

  return { eligible, fixtureExcludedCount, fixtureExcludedByRule };
}

/**
 * Every auth.users row with an email (no opt-in filter).
 * Used as the email source; Model B filters via newsletter_opted_in below.
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

/**
 * Account audience for Friday send (Model B): profiles.newsletter_opted_in = true.
 * Emails still resolved from auth.users via listAllAccountEmails.
 */
export async function listOptedInAccountEmails(
  supabase: SupabaseClient,
): Promise<BlogRecipientRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("newsletter_opted_in", true);

  if (error) {
    throw new Error(`profiles newsletter_opted_in query failed: ${error.message}`);
  }

  const optedInIds = new Set((data ?? []).map((row) => String(row.id)));
  const accounts = await listAllAccountEmails(supabase);
  return accounts.filter(
    (row) => row.userId != null && optedInIds.has(row.userId),
  );
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
  fixtureExcludedCount: number;
  fixtureExcludedByRule: Record<string, string[]>;
  suppressedCount: number;
  eligible: BlogRecipientRow[];
}> {
  const [accounts, newsletter] = await Promise.all([
    listOptedInAccountEmails(supabase),
    listNewsletterSubscriberEmails(supabase),
  ]);
  const merged = mergeRecipientSources(accounts, newsletter);
  const { eligible: afterInternal, internalExcludedCount } =
    applyInternalAccountFilter(merged);
  const {
    eligible: afterFixture,
    fixtureExcludedCount,
    fixtureExcludedByRule,
  } = applyTestFixtureFilter(afterInternal);
  const suppressed = await loadSuppressedEmails(supabase);
  const { eligible, suppressedCount } = applySuppressionFilter(
    afterFixture,
    suppressed,
  );

  return {
    totalAccounts: accounts.length,
    totalNewsletterSubscribers: newsletter.length,
    totalUniqueRecipients: merged.length,
    internalExcludedCount,
    fixtureExcludedCount,
    fixtureExcludedByRule,
    suppressedCount,
    eligible,
  };
}
