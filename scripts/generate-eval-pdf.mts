/**
 * Local-only: render a completed evaluation page to a full-color PDF via headless Chrome.
 *
 * Prerequisites:
 * 1. `npm run dev` running (default base URL http://localhost:3000)
 * 2. `.pdf-auth-cookies.json` at repo root — run `npm run pdf:auth-cookies` (tokens expire ~1h)
 *
 * Usage:
 *   npm run pdf:eval -- <evaluationId> <sermonId>
 *   PDF_EVALUATION_ID=... PDF_SERMON_ID=... npm run pdf:eval
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type CookieParam, type Page } from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const COOKIE_FILE = path.join(REPO_ROOT, ".pdf-auth-cookies.json");
const OUTPUT_DIR = path.join(REPO_ROOT, "output", "eval-pdf");
const AUTH_COOKIE_ERROR =
  "Auth cookies expired or missing. Run: npm run pdf:auth-cookies";

type StoredCookie = CookieParam & {
  name: string;
  value: string;
};

type SupabaseSessionPayload = {
  expires_at?: number;
};

function parseArgs(): { evaluationId: string; sermonId: string } {
  const [, , evaluationIdArg, sermonIdArg] = process.argv;
  const evaluationId = evaluationIdArg ?? process.env.PDF_EVALUATION_ID;
  const sermonId = sermonIdArg ?? process.env.PDF_SERMON_ID;

  if (!evaluationId?.trim() || !sermonId?.trim()) {
    throw new Error(
      "Missing evaluationId and sermonId.\nUsage: npm run pdf:eval -- <evaluationId> <sermonId>\nOr set PDF_EVALUATION_ID and PDF_SERMON_ID.",
    );
  }

  return { evaluationId: evaluationId.trim(), sermonId: sermonId.trim() };
}

function decodeSupabaseSession(value: string): SupabaseSessionPayload | null {
  const encoded = value.startsWith("base64-")
    ? value.slice("base64-".length)
    : value;

  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as SupabaseSessionPayload;
  } catch {
    return null;
  }
}

function findAuthTokenCookie(cookies: StoredCookie[]): StoredCookie | null {
  return (
    cookies.find((cookie) => /-auth-token$/.test(cookie.name)) ??
    cookies.find((cookie) => /-auth-token\.\d+$/.test(cookie.name)) ??
    cookies.find((cookie) => cookie.name.startsWith("sb-")) ??
    null
  );
}

function validateAuthCookies(cookies: StoredCookie[]): void {
  const authCookie = findAuthTokenCookie(cookies);
  if (!authCookie) {
    throw new Error(AUTH_COOKIE_ERROR);
  }

  const session = decodeSupabaseSession(authCookie.value);
  if (!session?.expires_at) {
    throw new Error(AUTH_COOKIE_ERROR);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expires_at <= nowSeconds) {
    throw new Error(AUTH_COOKIE_ERROR);
  }
}

async function loadCookies(): Promise<StoredCookie[]> {
  let raw: string;
  try {
    raw = await fs.readFile(COOKIE_FILE, "utf8");
  } catch {
    throw new Error(AUTH_COOKIE_ERROR);
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(AUTH_COOKIE_ERROR);
  }

  return parsed.map((cookie, index) => {
    if (
      typeof cookie !== "object" ||
      cookie === null ||
      typeof (cookie as StoredCookie).name !== "string" ||
      typeof (cookie as StoredCookie).value !== "string"
    ) {
      throw new Error(`Invalid cookie at index ${index} in .pdf-auth-cookies.json`);
    }
    return cookie as StoredCookie;
  });
}

function toPuppeteerCookie(cookie: StoredCookie, baseUrl: string): CookieParam {
  const mapped: CookieParam = {
    name: cookie.name,
    value: cookie.value,
    url: baseUrl,
  };

  if (cookie.expires && cookie.expires > 0) {
    mapped.expires = cookie.expires;
  }
  if (cookie.httpOnly) {
    mapped.httpOnly = cookie.httpOnly;
  }
  if (cookie.secure) {
    mapped.secure = cookie.secure;
  }
  if (cookie.sameSite) {
    mapped.sameSite = cookie.sameSite;
  }

  return mapped;
}

async function waitForEvaluationRender(page: Page): Promise<void> {
  await page.waitForSelector('[data-pdf-capture="1"]', { timeout: 60_000 });
  await page.waitForSelector(".evaluation-report", { timeout: 60_000 });
  await page.waitForSelector(".evaluation-headline-lockup", { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document
      .querySelectorAll(".evaluation-report details")
      .forEach((node) => node.setAttribute("open", ""));
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function main(): Promise<void> {
  const baseUrl = process.env.PDF_BASE_URL ?? "http://localhost:3000";
  const { evaluationId, sermonId } = parseArgs();
  const cookies = await loadCookies();
  validateAuthCookies(cookies);

  const url = `${baseUrl}/dashboard/sermons/${sermonId}/evaluations/${evaluationId}?pdf=1`;
  if (!url.includes("?pdf=1")) {
    throw new Error(`Internal error: capture URL must include ?pdf=1 (got ${url})`);
  }

  const outputPath = path.join(OUTPUT_DIR, `${evaluationId}.pdf`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.emulateMediaType("screen");
    await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 2 });

    await page.setCookie(...cookies.map((cookie) => toPuppeteerCookie(cookie, baseUrl)));

    const response = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 120_000,
    });

    const finalUrl = page.url();
    if (finalUrl.includes("/login")) {
      throw new Error(
        "Redirected to login — cookies invalid. Run: npm run pdf:auth-cookies",
      );
    }

    const status = response?.status() ?? 0;
    if (status === 404) {
      throw new Error(
        `Evaluation not found (404) at ${url}. Auth passed but these sermon/eval IDs returned no row. Check IDs and RLS.`,
      );
    }

    if (!response || !response.ok()) {
      throw new Error(
        `Failed to load ${url} (status ${status}). Is the dev server running?`,
      );
    }

    await waitForEvaluationRender(page);

    await page.emulateMediaType("screen");

    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    console.log(`Wrote ${outputPath}`);
    console.log(`  sermonId=${sermonId}`);
    console.log(`  evaluationId=${evaluationId}`);
    console.log(`  source=${url}`);
    console.log("  capture=screen (?pdf=1 full-color render)");
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
