/**
 * Manual Friday blog-teaser send via Resend.
 *
 * Usage:
 *   RESEND_MODE=test RESEND_TEST_TO=you@example.com RESEND_API_KEY=re_... npm run blog:send -- --week=1
 *
 * Modes:
 *   test — sends to RESEND_TEST_TO only (never a real list)
 *   send — not implemented yet (real subscriber list TBD)
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderBlogEmailHtml } from "../src/lib/email/blog-email-template";
import type { BlogEmailWeekContent } from "../src/lib/email/blog-email-types";
import { sendResendEmail } from "../src/lib/email/resend-send";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "blog-email");
const OUTPUT_DIR = path.join(REPO_ROOT, "output", "blog-email");

/** Placeholder until a real unsubscribe endpoint exists. */
const TEST_UNSUBSCRIBE_URL =
  "https://www.sermoncoach.online/unsubscribe?pending=1";

type ResendMode = "test" | "send";

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

function parseMode(): ResendMode {
  const mode = process.env.RESEND_MODE?.trim().toLowerCase();
  if (mode === "test") {
    return "test";
  }
  if (mode === "send") {
    return "send";
  }
  throw new Error(
    "Set RESEND_MODE=test or RESEND_MODE=send.\nFor this pass, only RESEND_MODE=test is supported.",
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

function resolveRecipients(mode: ResendMode): string[] {
  if (mode === "send") {
    throw new Error(
      "RESEND_MODE=send is not implemented yet. Real subscriber list wiring is deferred until Chris defines the audience source.",
    );
  }

  const testTo = process.env.RESEND_TEST_TO?.trim();
  if (!testTo) {
    throw new Error(
      "RESEND_MODE=test requires RESEND_TEST_TO (single override address).",
    );
  }

  return [testTo];
}

async function main(): Promise<void> {
  await loadEnvLocal();

  const week = parseWeekArg();
  const mode = parseMode();
  const content = await loadWeekContent(week);
  const recipients = resolveRecipients(mode);

  const html = renderBlogEmailHtml({
    content,
    unsubscribeUrl: TEST_UNSUBSCRIBE_URL,
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const previewPath = path.join(OUTPUT_DIR, `week-${week}-rendered.html`);
  await fs.writeFile(previewPath, html, "utf8");

  if (process.platform === "darwin") {
    execSync(`open "${previewPath}"`);
  }

  console.log(`Rendered preview: ${previewPath}`);
  console.log(`Mode: ${mode}`);
  console.log(`Week: ${week}`);
  console.log(`Subject: ${content.subject}`);
  console.log(`To: ${recipients.join(", ")}`);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is required. Add it to .env.local or export it in the shell (same key as Supabase Edge Functions).",
    );
  }

  const sendResult = await sendResendEmail({
    apiKey,
    to: recipients,
    subject: content.subject,
    html,
  });

  if (!sendResult.ok) {
    throw new Error(sendResult.error);
  }

  console.log(`Sent via Resend: ${sendResult.id}`);
  console.log(`From: Chris Daukas <chris@sermoncoach.online>`);
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
