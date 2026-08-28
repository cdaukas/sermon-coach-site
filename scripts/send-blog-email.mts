/**
 * Manual Friday blog-teaser send via Resend.
 *
 * Usage:
 *   RESEND_MODE=test RESEND_TEST_TO=you@example.com npm run blog:send -- --week=1
 *   RESEND_MODE=dryrun npm run blog:send -- --week=1
 *   RESEND_MODE=send npm run blog:send -- --week=1
 *
 * Modes:
 *   test   — sends to RESEND_TEST_TO only (never a real list)
 *   dryrun — queries real list + suppression, prints count/sample, sends nothing
 *   send   — sends to every eligible account (manual trigger, no cron)
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveEligibleBlogRecipients } from "../src/lib/email/blog-recipients";
import { renderBlogEmailHtml } from "../src/lib/email/blog-email-template";
import type { BlogEmailWeekContent } from "../src/lib/email/blog-email-types";
import { BLOG_EMAIL_FROM } from "../src/lib/email/constants";
import { sendResendEmail } from "../src/lib/email/resend-send";
import {
  buildUnsubscribePostUrl,
  buildUnsubscribeUrl,
} from "../src/lib/email/unsubscribe";
import { createAdminClient } from "../src/lib/supabase/admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "blog-email");
const OUTPUT_DIR = path.join(REPO_ROOT, "output", "blog-email");

type ResendMode = "test" | "dryrun" | "send";

const SEND_BATCH_DELAY_MS = 600;

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional if vars are exported in the shell.
  }
}

function parseWeekArg(): number {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--week=")) {
      const value = Number.parseInt(arg.slice("--week=".length), 10);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
    if (arg === "--week") {
      throw new Error("Missing value for --week. Use --week=1.");
    }
  }

  const fromEnv = process.env.BLOG_EMAIL_WEEK;
  if (fromEnv) {
    const value = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  throw new Error(
    "Missing week number.\nUsage: npm run blog:send -- --week=1",
  );
}

function parseModeArg(): ResendMode | null {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--mode=")) {
      const value = arg.slice("--mode=".length).trim().toLowerCase();
      if (value === "test" || value === "dryrun" || value === "send") {
        return value;
      }
      throw new Error(`Invalid --mode=${value}. Use test, dryrun, or send.`);
    }
  }
  return null;
}

function parseMode(): ResendMode {
  const fromArg = parseModeArg();
  if (fromArg) {
    return fromArg;
  }

  const mode = process.env.RESEND_MODE?.trim().toLowerCase();
  if (mode === "test" || mode === "dryrun" || mode === "send") {
    return mode;
  }

  throw new Error(
    "Set RESEND_MODE=test, dryrun, or send (or pass --mode=test|dryrun|send).",
  );
}

function assertBlogEmailWeekContent(
  value: unknown,
  week: number,
): BlogEmailWeekContent {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Invalid week-${week}.json: expected an object.`);
  }

  const record = value as Record<string, unknown>;
  const required = ["week", "subject", "headline", "teaserHtml", "blogUrl"] as const;

  for (const key of required) {
    if (typeof record[key] !== "string" && typeof record[key] !== "number") {
      throw new Error(`Invalid week-${week}.json: missing or invalid "${key}".`);
    }
  }

  if (Number(record.week) !== week) {
    throw new Error(
      `week-${week}.json has week=${String(record.week)}; expected week=${week}.`,
    );
  }

  return {
    week: Number(record.week),
    subject: String(record.subject),
    headline: String(record.headline),
    teaserHtml: String(record.teaserHtml),
    blogUrl: String(record.blogUrl),
  };
}

async function loadWeekContent(week: number): Promise<BlogEmailWeekContent> {
  const filePath = path.join(CONTENT_DIR, `week-${week}.json`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`No content file at content/blog-email/week-${week}.json`);
  }

  return assertBlogEmailWeekContent(JSON.parse(raw) as unknown, week);
}

async function resolveRecipients(
  mode: ResendMode,
): Promise<{
  emails: string[];
  totalAccounts?: number;
  totalNewsletterSubscribers?: number;
  totalUniqueRecipients?: number;
  internalExcludedCount?: number;
  fixtureExcludedCount?: number;
  fixtureExcludedByRule?: Record<string, string[]>;
  suppressedCount?: number;
}> {
  if (mode === "test") {
    const testTo = process.env.RESEND_TEST_TO?.trim();
    if (!testTo) {
      throw new Error(
        "RESEND_MODE=test requires RESEND_TEST_TO (single override address).",
      );
    }
    return { emails: [testTo] };
  }

  const supabase = createAdminClient();
  const {
    totalAccounts,
    totalNewsletterSubscribers,
    totalUniqueRecipients,
    internalExcludedCount,
    fixtureExcludedCount,
    fixtureExcludedByRule,
    suppressedCount,
    eligible,
  } = await resolveEligibleBlogRecipients(supabase);

  return {
    emails: eligible.map((row) => row.email),
    totalAccounts,
    totalNewsletterSubscribers,
    totalUniqueRecipients,
    internalExcludedCount,
    fixtureExcludedCount,
    fixtureExcludedByRule,
    suppressedCount,
  };
}

function printRecipientCountBlock(opts: {
  totalUniqueRecipients: number;
  internalExcludedCount: number;
  fixtureExcludedCount: number;
  fixtureExcludedByRule: Record<string, string[]>;
  suppressedCount: number;
  eligibleCount: number;
}): void {
  const {
    totalUniqueRecipients,
    internalExcludedCount,
    fixtureExcludedCount,
    fixtureExcludedByRule,
    suppressedCount,
    eligibleCount,
  } = opts;

  console.log(`merged unique:        ${totalUniqueRecipients}`);
  console.log(`internal excluded:    ${internalExcludedCount}`);
  console.log(`fixture excluded:     ${fixtureExcludedCount}`);

  const preferredRuleOrder = [
    "example.com",
    "example.org",
    "example.net",
    "vtext.com",
    "txt.att.net",
    "tmomail.net",
    "msg.fi.google.com",
    "sketch-",
    "acq-",
    "rr-",
    "cdaukas+",
  ];

  const ruleEntries: Array<[string, string[]]> = [];
  const seen = new Set<string>();
  for (const rule of preferredRuleOrder) {
    const emails = fixtureExcludedByRule[rule];
    if (emails && emails.length > 0) {
      ruleEntries.push([rule, emails]);
      seen.add(rule);
    }
  }
  for (const [rule, emails] of Object.entries(fixtureExcludedByRule)) {
    if (!seen.has(rule) && emails.length > 0) {
      ruleEntries.push([rule, emails]);
    }
  }

  if (ruleEntries.length > 0) {
    const [firstKey, firstEmails] = ruleEntries[0]!;
    console.log(`   by rule:  ${firstKey}: ${firstEmails.length}`);
    for (const [rule, emails] of ruleEntries.slice(1)) {
      console.log(`             ${rule}: ${emails.length}`);
    }
  }

  console.log(`suppressed:           ${suppressedCount}`);
  console.log(`ELIGIBLE:             ${eligibleCount}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  await loadEnvLocal();

  const week = parseWeekArg();
  const mode = parseMode();
  const content = await loadWeekContent(week);
  const {
    emails,
    totalUniqueRecipients,
    internalExcludedCount,
    fixtureExcludedCount,
    fixtureExcludedByRule,
    suppressedCount,
  } = await resolveRecipients(mode);

  const previewRecipient = emails[0] ?? process.env.RESEND_TEST_TO ?? "preview@example.com";
  const previewHtml = renderBlogEmailHtml({
    content,
    unsubscribeUrl: buildUnsubscribeUrl(previewRecipient),
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const previewPath = path.join(OUTPUT_DIR, `week-${week}-rendered.html`);
  await fs.writeFile(previewPath, previewHtml, "utf8");

  if (process.platform === "darwin") {
    execSync(`open "${previewPath}"`);
  }

  console.log(`Rendered preview: ${previewPath}`);
  console.log(`Mode: ${mode}`);
  console.log(`Week: ${week}`);
  console.log(`Subject: ${content.subject}`);

  if (mode === "dryrun") {
    printRecipientCountBlock({
      totalUniqueRecipients: totalUniqueRecipients ?? emails.length,
      internalExcludedCount: internalExcludedCount ?? 0,
      fixtureExcludedCount: fixtureExcludedCount ?? 0,
      fixtureExcludedByRule: fixtureExcludedByRule ?? {},
      suppressedCount: suppressedCount ?? 0,
      eligibleCount: emails.length,
    });

    const fixtureEmails = Object.values(fixtureExcludedByRule ?? {})
      .flat()
      .sort((a, b) => a.localeCompare(b));
    console.log("Fixture-excluded addresses:");
    for (const email of fixtureEmails) {
      console.log(`  - ${email}`);
    }

    console.log("Full eligible list:");
    for (const email of emails) {
      console.log(`  - ${email}`);
    }
    console.log("Dry run complete — no emails sent.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is required. Add it to .env.local or export it in the shell (same key as Supabase Edge Functions).",
    );
  }

  if (mode === "send") {
    printRecipientCountBlock({
      totalUniqueRecipients: totalUniqueRecipients ?? emails.length,
      internalExcludedCount: internalExcludedCount ?? 0,
      fixtureExcludedCount: fixtureExcludedCount ?? 0,
      fixtureExcludedByRule: fixtureExcludedByRule ?? {},
      suppressedCount: suppressedCount ?? 0,
      eligibleCount: emails.length,
    });
    console.log(`Sending to ${emails.length} eligible recipients…`);
  } else {
    console.log(`To: ${emails.join(", ")}`);
  }

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const html = renderBlogEmailHtml({
      content,
      unsubscribeUrl: buildUnsubscribeUrl(email),
    });

    const sendResult = await sendResendEmail({
      apiKey,
      to: [email],
      subject: content.subject,
      html,
      unsubscribePostUrl: buildUnsubscribePostUrl(email),
    });

    if (!sendResult.ok) {
      failed += 1;
      console.error(`Failed ${email}: ${sendResult.error}`);
      continue;
    }

    sent += 1;
    if (mode === "test") {
      console.log(`Sent via Resend: ${sendResult.id}`);
      console.log(`From: ${BLOG_EMAIL_FROM}`);
      return;
    }

    if (sent % 25 === 0) {
      console.log(`Progress: ${sent}/${emails.length} sent…`);
    }

    await sleep(SEND_BATCH_DELAY_MS);
  }

  if (mode === "send") {
    console.log(`Send complete: ${sent} sent, ${failed} failed.`);
  }
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
