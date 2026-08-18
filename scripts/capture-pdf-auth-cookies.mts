/**
 * One-time helper: open localhost in a headed browser, wait for login, save session
 * cookies to .pdf-auth-cookies.json for scripts/generate-eval-pdf.mts.
 *
 * Prerequisites: `npm run dev` running.
 *
 * When Supabase CAPTCHA is on, complete the Turnstile challenge in the headed
 * browser if login prompts for it (see .cursor/skills/eval-pdf/SKILL.md).
 *
 * Usage:
 *   npm run pdf:auth-cookies
 */
import fs from "node:fs/promises";
import os from "node:os";
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
  console.log(
    "Sign in if prompted (Google Chrome window — not Chrome for Testing). Cookies save once you leave /login.",
  );

  const browser = await puppeteer.launch({
    channel: "chrome",
    headless: false,
    defaultViewport: null,
    // waitForFunction is 5 minutes; Puppeteer's default protocolTimeout is 180s.
    protocolTimeout: 6 * 60_000,
    // Chrome for Testing sets navigator.webdriver; Turnstile then fails with 600010.
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--disable-blink-features=AutomationControlled",
      "--window-position=80,80",
      "--window-size=1100,800",
    ],
    userDataDir: path.join(os.tmpdir(), "sermon-coach-pdf-auth-chrome"),
  });

  try {
    const page = await browser.newPage();
    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    console.log(`Now at ${page.url()}`);

    // /login is the unauthenticated landing. After sign-in, middleware may send
    // settled users to /dashboard or attribution-gated users to /start.
    await page.waitForFunction(
      () => {
        const { pathname } = window.location;
        const onAuthForm =
          pathname === "/login" ||
          pathname.startsWith("/login/") ||
          pathname === "/signup" ||
          pathname.startsWith("/signup/") ||
          pathname === "/reset-password" ||
          pathname.startsWith("/reset-password");
        return !onAuthForm;
      },
      { timeout: 5 * 60_000 },
    );
    console.log(`Signed in — landed on ${page.url()}`);

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
