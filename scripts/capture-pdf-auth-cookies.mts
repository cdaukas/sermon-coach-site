/**
 * One-time helper: open localhost in a headed browser, wait for login, save session
 * cookies to .pdf-auth-cookies.json for scripts/generate-eval-pdf.mts.
 *
 * Prerequisites: `npm run dev` running.
 *
 * Usage:
 *   npm run pdf:auth-cookies
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type Cookie, type CookieParam } from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const COOKIE_FILE = path.join(REPO_ROOT, ".pdf-auth-cookies.json");

type StoredCookie = CookieParam & {
  name: string;
  value: string;
};

function toStoredCookie(cookie: Cookie): StoredCookie {
  const stored: StoredCookie = {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
  };

  if (cookie.expires && cookie.expires > 0) {
    stored.expires = cookie.expires;
  }
  if (cookie.httpOnly) {
    stored.httpOnly = true;
  }
  if (cookie.secure) {
    stored.secure = cookie.secure;
  }
  if (cookie.sameSite) {
    stored.sameSite = cookie.sameSite;
  }

  return stored;
}

function isAuthCookie(cookie: Cookie): boolean {
  return cookie.name.startsWith("sb-");
}

async function main(): Promise<void> {
  const baseUrl = process.env.PDF_BASE_URL ?? "http://localhost:3000";
  const dashboardUrl = `${baseUrl}/dashboard`;

  console.log(`Opening ${dashboardUrl}`);
  console.log("Sign in if prompted. This script saves cookies once you reach the dashboard.");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });

    await page.waitForFunction(
      () => {
        const { pathname } = window.location;
        return pathname.startsWith("/dashboard") && pathname !== "/dashboard/login";
      },
      { timeout: 5 * 60_000 },
    );

    const cookies = await page.cookies(baseUrl);
    const authCookies = cookies.filter(isAuthCookie);

    if (authCookies.length === 0) {
      throw new Error(
        `No sb-* auth cookies found for ${baseUrl}. Complete login in the opened browser window.`,
      );
    }

    const stored = authCookies.map(toStoredCookie);
    await fs.writeFile(COOKIE_FILE, `${JSON.stringify(stored, null, 2)}\n`, "utf8");

    console.log(`Saved ${stored.length} cookie(s) to ${path.relative(REPO_ROOT, COOKIE_FILE)}`);
    for (const cookie of stored) {
      console.log(`  ${cookie.name}`);
    }
    console.log("Run: npm run pdf:eval -- <evaluationId> <sermonId>");
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
