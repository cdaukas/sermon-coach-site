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
 *   PDF_PREPARED_FOR="Pastor Name" PDF_COVER_VARIANT=theirs|mine npm run pdf:eval
 *   PDF_PREACHER="Preacher Name" npm run pdf:eval
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

function stripLeadingHonorific(name: string): string {
  return name
    .trim()
    .replace(/^(?:pastor|rev\.?|reverend|dr\.?|pr\.?)\s+/i, "")
    .trim();
}

function theirsPreacherNamesMatch(preacher: string, preparedFor: string): boolean {
  return (
    stripLeadingHonorific(preacher).toLowerCase() ===
    stripLeadingHonorific(preparedFor).toLowerCase()
  );
}

function warnTheirsPreacherMismatch(preacher: string, preparedFor: string): void {
  console.warn("");
  console.warn(
    `WARNING: variant=theirs but preacher (${preacher}) != preparedFor (${preparedFor}). On 'theirs' the sermon should be`,
  );
  console.warn(
    "the recipient's own. Check your IDs — you may be sending someone else's evaluation.",
  );
  console.warn("");
}

function buildCaptureUrl(
  baseUrl: string,
  sermonId: string,
  evaluationId: string,
): {
  url: string;
  preparedFor: string | null;
  coverVariant: "theirs" | "mine" | null;
  preacher: string | null;
} {
  const params = new URLSearchParams({ pdf: "1" });
  const preparedFor = process.env.PDF_PREPARED_FOR?.trim() ?? "";
  const preacherEnv = process.env.PDF_PREACHER?.trim() ?? "";
  let coverVariant: "theirs" | "mine" | null = null;
  let resolvedPreacher: string | null = preacherEnv || null;

  if (preparedFor) {
    params.set("for", preparedFor);
    coverVariant =
      process.env.PDF_COVER_VARIANT?.trim() === "mine" ? "mine" : "theirs";
    params.set("variant", coverVariant);

    if (coverVariant === "theirs") {
      if (preacherEnv) {
        if (!theirsPreacherNamesMatch(preacherEnv, preparedFor)) {
          warnTheirsPreacherMismatch(preacherEnv, preparedFor);
        }
        resolvedPreacher = preacherEnv;
      } else {
        resolvedPreacher = stripLeadingHonorific(preparedFor);
      }
    } else {
      resolvedPreacher = preacherEnv || null;
    }
  } else if (preacherEnv) {
    resolvedPreacher = preacherEnv;
  }

  if (resolvedPreacher) {
    params.set("preacher", resolvedPreacher);
  }

  return {
    url: `${baseUrl}/dashboard/sermons/${sermonId}/evaluations/${evaluationId}?${params.toString()}`,
    preparedFor: preparedFor || null,
    coverVariant,
    preacher: resolvedPreacher,
  };
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
  await page.evaluate(() => {
    const cards = document.querySelectorAll(".evaluation-category-card");
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const header = card.querySelector(":scope > header");
      if (!header) continue;
      const next = header.nextElementSibling; // the AVERAGE bar
      if (!next) continue;
      const bond = document.createElement("div");
      bond.setAttribute("data-pdf-bond", "1");
      header.parentNode!.insertBefore(bond, header);
      bond.appendChild(header);
      bond.appendChild(next);
    }
  });

  await page.addStyleTag({
    content: `
    [data-pdf-bond="1"] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    html[data-pdf-capture="1"] .evaluation-category-card > header,
    [data-pdf-bond="1"] > header {
      min-height: 0 !important;
      height: auto !important;
    }
  `,
  });

  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function main(): Promise<void> {
  const baseUrl = process.env.PDF_BASE_URL ?? "http://localhost:3000";
  const { evaluationId, sermonId } = parseArgs();
  const cookies = await loadCookies();
  validateAuthCookies(cookies);

  const { url, preparedFor, coverVariant, preacher } = buildCaptureUrl(
    baseUrl,
    sermonId,
    evaluationId,
  );
  if (!url.includes("?pdf=1")) {
    throw new Error(`Internal error: capture URL must include ?pdf=1 (got ${url})`);
  }

  console.log(
    "PDF_PREPARED_FOR:",
    process.env.PDF_PREPARED_FOR === undefined
      ? "(undefined)"
      : JSON.stringify(process.env.PDF_PREPARED_FOR),
  );
  console.log(
    "PDF_COVER_VARIANT:",
    process.env.PDF_COVER_VARIANT === undefined
      ? "(undefined)"
      : JSON.stringify(process.env.PDF_COVER_VARIANT),
  );
  console.log(
    "PDF_PREACHER:",
    process.env.PDF_PREACHER === undefined
      ? "(undefined)"
      : JSON.stringify(process.env.PDF_PREACHER),
  );
  console.log(
    `PDF resolved: variant=${coverVariant ?? "(none)"} preparedFor=${preparedFor ?? "(none)"} preacher=${preacher ?? "(none)"}`,
  );
  console.log("CAPTURE URL:", url);

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

    const coverCheck = await page.evaluate(() => {
      return {
        coverEl: document.querySelectorAll(".evaluation-pdf-cover").length,
        searchParams: window.location.search,
      };
    });
    console.log("COVER CHECK:", JSON.stringify(coverCheck));

    await waitForEvaluationRender(page);

    await page.emulateMediaType("screen");

    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `<div style="width:100%;font-size:8px;font-family:-apple-system,sans-serif;color:#4a5568;padding:0 0.55in;display:flex;justify-content:space-between;"><span>The Sermon Coach™</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.7in",
        left: "0.5in",
      },
    });

    console.log(`Wrote ${outputPath}`);
    console.log(`  sermonId=${sermonId}`);
    console.log(`  evaluationId=${evaluationId}`);
    if (preparedFor) {
      console.log(`  preparedFor=${preparedFor}`);
      console.log(`  coverVariant=${coverVariant}`);
    }
    if (preacher) {
      console.log(`  preacher=${preacher}`);
    }
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
