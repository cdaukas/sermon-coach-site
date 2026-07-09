/**
 * Throwaway spike runner — Supadata playground (no API key) + optional API keys.
 */
import puppeteer from "puppeteer";

const URLS = [
  { id: 1, label: "Santa Cruz Baptist", url: "https://www.youtube.com/watch?v=H0Iuk3LBbq0" },
  { id: 2, label: "Living Stones full service", url: "https://www.youtube.com/watch?v=mZd-pJ7xOps" },
  { id: 3, label: "Gilbert Bible John 5", url: "https://www.youtube.com/watch?v=SVe7s1P05i4" },
  { id: 4, label: "El Redil Spanish", url: "https://www.youtube.com/watch?v=NPJfTJj_40w" },
  { id: 5, label: "Gilbert fresh livestream", url: "https://www.youtube.com/watch?v=OrCi6CMutus" },
] as const;

type RunResult = {
  provider: "Supadata";
  urlId: number;
  label: string;
  success: boolean;
  latencyMs: number;
  failureType: string | null;
  outputFormat: string | null;
  charCount: number | null;
  lang: string | null;
  httpStatus: number | null;
  rawError: string | null;
  sample: string | null;
};

async function runSupadataPlayground(
  page: puppeteer.Page,
  item: (typeof URLS)[number],
): Promise<RunResult> {
  const start = performance.now();
  await page.goto("https://supadata.ai/playground", { waitUntil: "networkidle2" });

  const urlInput = await page.waitForSelector(
    'input[placeholder="Enter YouTube, TikTok, etc. video URL"]',
  );
  await urlInput!.click({ clickCount: 3 });
  await urlInput!.type(item.url);

  const apiCalls: { url: string; status: number; body: string }[] = [];
  const handler = async (response: puppeteer.HTTPResponse) => {
    const u = response.url();
    if (u.includes("supadata") && (u.includes("transcript") || u.includes("api"))) {
      try {
        apiCalls.push({
          url: u,
          status: response.status(),
          body: (await response.text()).slice(0, 500),
        });
      } catch {
        // ignore
      }
    }
  };
  page.on("response", handler);

  await page.click('button:has-text("Run")').catch(async () => {
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text?.trim() === "Run") {
        await btn.click();
        break;
      }
    }
  });

  await page.waitForFunction(
    () => {
      const code = document.querySelector("code");
      return code && code.textContent && code.textContent.length > 20;
    },
    { timeout: 30000 },
  ).catch(() => null);

  await new Promise((r) => setTimeout(r, 1000));

  const codeText = await page.evaluate(() => {
    const code = document.querySelector("code");
    return code?.textContent ?? "";
  });

  page.off("response", handler);
  const latencyMs = Math.round(performance.now() - start);

  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(codeText) as Record<string, unknown>;
  } catch {
    // not json
  }

  if (parsed && !parsed.error) {
    const content = parsed.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((c) =>
                typeof c === "object" && c && "text" in c
                  ? String((c as { text: string }).text)
                  : "",
              )
              .join(" ")
          : "";

    return {
      provider: "Supadata",
      urlId: item.id,
      label: item.label,
      success: text.trim().length > 0,
      latencyMs,
      failureType: text.trim() ? null : "EMPTY_CONTENT",
      outputFormat:
        typeof content === "string"
          ? "plain text"
          : "JSON chunks {text, offset, duration, lang}",
      charCount: text.length,
      lang: typeof parsed.lang === "string" ? parsed.lang : null,
      httpStatus: apiCalls.at(-1)?.status ?? 200,
      rawError: null,
      sample: text.slice(0, 120).replace(/\s+/g, " "),
    };
  }

  const errObj =
    parsed && typeof parsed === "object"
      ? ((parsed.error as string | undefined) ??
        (parsed.message as string | undefined) ??
        JSON.stringify(parsed))
      : codeText.slice(0, 300);

  const lower = String(errObj).toLowerCase();
  let failureType = "PROVIDER_ERROR";
  if (lower.includes("transcript-unavailable") || lower.includes("unavailable")) {
    failureType = "NO_CAPTIONS";
  } else if (lower.includes("not-found") || lower.includes("not found")) {
    failureType = "VIDEO_UNAVAILABLE";
  }

  return {
    provider: "Supadata",
    urlId: item.id,
    label: item.label,
    success: false,
    latencyMs,
    failureType,
    outputFormat: null,
    charCount: null,
    lang: null,
    httpStatus: apiCalls.at(-1)?.status ?? null,
    rawError: String(errObj).slice(0, 300),
    sample: null,
  };
}

async function runTranscriptApiDirect(
  apiKey: string,
  item: (typeof URLS)[number],
): Promise<RunResult> {
  const start = performance.now();
  const videoId = item.url.split("v=")[1]?.split("&")[0] ?? item.url;
  const params = new URLSearchParams({
    video_url: videoId,
    format: "text",
    include_timestamp: "false",
  });

  const res = await fetch(
    `https://transcriptapi.com/api/v2/youtube/transcript?${params}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  const body = await res.text();
  const latencyMs = Math.round(performance.now() - start);

  if (res.ok) {
    let text = body;
    let lang: string | null = null;
    try {
      const parsed = JSON.parse(body) as {
        transcript?: string | Array<{ text?: string }>;
        language?: string;
      };
      lang = parsed.language ?? null;
      if (typeof parsed.transcript === "string") text = parsed.transcript;
      else if (Array.isArray(parsed.transcript)) {
        text = parsed.transcript.map((s) => s.text ?? "").join(" ");
      }
    } catch {
      // plain text body
    }

    return {
      provider: "Supadata" as never,
      urlId: item.id,
      label: item.label,
      success: text.trim().length > 0,
      latencyMs,
      failureType: text.trim() ? null : "EMPTY_CONTENT",
      outputFormat: "json transcript[] or plain text",
      charCount: text.length,
      lang,
      httpStatus: res.status,
      rawError: null,
      sample: text.slice(0, 120).replace(/\s+/g, " "),
    };
  }

  const lower = body.toLowerCase();
  let failureType = "PROVIDER_ERROR";
  if (res.status === 404 || lower.includes("no caption") || lower.includes("no transcript")) {
    failureType = "NO_CAPTIONS";
  } else if (lower.includes("not found") || lower.includes("unavailable")) {
    failureType = "VIDEO_UNAVAILABLE";
  }

  return {
    provider: "Supadata" as never,
    urlId: item.id,
    label: item.label,
    success: false,
    latencyMs,
    failureType,
    outputFormat: null,
    charCount: null,
    lang: null,
    httpStatus: res.status,
    rawError: body.slice(0, 300),
    sample: null,
  };
}

async function main(): Promise<void> {
  const transcriptApiKey = process.env.TRANSCRIPTAPI_API_KEY?.trim();
  const supadataKey = process.env.SUPADATA_API_KEY?.trim();
  const results: Array<RunResult & { provider: string }> = [];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const item of URLS) {
    if (supadataKey) {
      // direct API with native mode
      const start = performance.now();
      const params = new URLSearchParams({
        url: item.url,
        text: "true",
        mode: "native",
      });
      const res = await fetch(
        `https://api.supadata.ai/v1/transcript?${params}`,
        { headers: { "x-api-key": supadataKey } },
      );
      const body = await res.text();
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(body) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
      const content = parsed?.content;
      const text = typeof content === "string" ? content : "";
      results.push({
        provider: "Supadata",
        urlId: item.id,
        label: item.label,
        success: res.ok && text.trim().length > 0,
        latencyMs: Math.round(performance.now() - start),
        failureType:
          res.ok && text.trim()
            ? null
            : res.status === 206
              ? "NO_CAPTIONS"
              : res.status === 404
                ? "VIDEO_UNAVAILABLE"
                : "PROVIDER_ERROR",
        outputFormat: "plain text (text=true, mode=native)",
        charCount: text.length || null,
        lang: typeof parsed?.lang === "string" ? parsed.lang : null,
        httpStatus: res.status,
        rawError: res.ok ? null : body.slice(0, 300),
        sample: text ? text.slice(0, 120).replace(/\s+/g, " ") : null,
      });
    } else {
      results.push(await runSupadataPlayground(page, item));
    }

    if (transcriptApiKey) {
      const r = await runTranscriptApiDirect(transcriptApiKey, item);
      results.push({ ...r, provider: "TranscriptAPI" });
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
