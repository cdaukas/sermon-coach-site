/**
 * Local-only: render a completed evaluation page to a full-color PDF via headless Chrome.
 *
 * Prerequisites:
 * 1. `npm run dev` running (default base URL http://localhost:3000)
 * 2. `.pdf-auth-cookies.json` at repo root — run `npm run pdf:auth-cookies` once
 *
 * Usage:
 *   npm run pdf:eval
 *   npm run pdf:eval -- <evaluationId> <sermonId>
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type CookieParam, type Page } from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_SERMON_ID = "f5ef3af0-10c1-4d97-8064-4917ac03e77e";
const DEFAULT_EVALUATION_ID = "65c356f1-d955-40fc-8bdb-7a34d5551a0c";
const COOKIE_FILE = path.join(REPO_ROOT, ".pdf-auth-cookies.json");
const OUTPUT_DIR = path.join(REPO_ROOT, "output", "eval-pdf");

type StoredCookie = CookieParam & {
  name: string;
  value: string;
};

function parseArgs(): { evaluationId: string; sermonId: string } {
  const [, , evaluationIdArg, sermonIdArg] = process.argv;
  return {
    evaluationId: evaluationIdArg ?? DEFAULT_EVALUATION_ID,
    sermonId: sermonIdArg ?? DEFAULT_SERMON_ID,
  };
}

async function loadCookies(): Promise<StoredCookie[]> {
  let raw: string;
  try {
    raw = await fs.readFile(COOKIE_FILE, "utf8");
  } catch {
    throw new Error(
      `Missing ${path.relative(REPO_ROOT, COOKIE_FILE)}. Run: npm run pdf:auth-cookies`,
    );
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      `${path.relative(REPO_ROOT, COOKIE_FILE)} must be a non-empty JSON array of cookie objects.`,
    );
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

  const url = `${baseUrl}/dashboard/sermons/${sermonId}/evaluations/${evaluationId}?pdf=1`;
  const outputPath = path.join(OUTPUT_DIR, `${evaluationId}.pdf`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.emulateMediaType("screen");
    await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 2 });

    const cookieDomain = new URL(baseUrl).hostname;
    await page.setCookie(
      ...cookies.map((cookie) => ({
        ...cookie,
        domain: cookie.domain ?? cookieDomain,
        path: cookie.path ?? "/",
      })),
    );

    const response = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 120_000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Failed to load ${url} (status ${response?.status() ?? "unknown"}). Is the dev server running and are cookies valid?`,
      );
    }

    const loginRedirect = page.url().includes("/login");
    if (loginRedirect) {
      throw new Error(
        "Redirected to /login — session cookies are missing or expired. Re-export .pdf-auth-cookies.json.",
      );
    }

    await waitForEvaluationRender(page);

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
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
