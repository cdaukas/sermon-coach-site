/**
 * Throwaway spike — Supadata vs TranscriptAPI (captions-only, mode=native where supported).
 * Usage:
 *   SUPADATA_API_KEY=... TRANSCRIPTAPI_API_KEY=... npx tsx tmp/spike-youtube-transcript.mts
 */

const URLS = [
  {
    id: 1,
    label: "Santa Cruz Baptist, Mark 15 (dormant, older)",
    url: "https://www.youtube.com/watch?v=H0Iuk3LBbq0",
  },
  {
    id: 2,
    label: "Living Stones South Reno, full service (dormant)",
    url: "https://www.youtube.com/watch?v=mZd-pJ7xOps",
  },
  {
    id: 3,
    label: "Gilbert Bible Church, John 5 (active, sermon-only)",
    url: "https://www.youtube.com/watch?v=SVe7s1P05i4",
  },
  {
    id: 4,
    label: "El Redil del Poblado, Spanish sermon",
    url: "https://www.youtube.com/watch?v=NPJfTJj_40w",
  },
  {
    id: 5,
    label: "Gilbert Bible Church, fresh livestream Jul 5",
    url: "https://www.youtube.com/watch?v=OrCi6CMutus",
  },
] as const;

type SpikeResult = {
  provider: string;
  urlId: number;
  label: string;
  success: boolean;
  latencyMs: number;
  httpStatus: number;
  failureType: string | null;
  outputFormat: string | null;
  charCount: number | null;
  lang: string | null;
  sample: string | null;
  rawError: string | null;
};

function extractVideoId(url: string): string {
  const u = new URL(url);
  if (u.hostname.includes("youtu.be")) {
    return u.pathname.slice(1);
  }
  return u.searchParams.get("v") ?? url;
}

async function fetchSupadata(
  apiKey: string,
  item: (typeof URLS)[number],
): Promise<SpikeResult> {
  const start = performance.now();
  const params = new URLSearchParams({
    url: item.url,
    text: "true",
    mode: "native",
  });

  let httpStatus = 0;
  let body: unknown;

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/transcript?${params.toString()}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
      },
    );
    httpStatus = res.status;
    body = await res.json().catch(() => null);
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok && body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const content = record.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .map((chunk) =>
                  typeof chunk === "object" &&
                  chunk &&
                  "text" in chunk &&
                  typeof (chunk as { text: unknown }).text === "string"
                    ? (chunk as { text: string }).text
                    : "",
                )
                .join(" ")
            : null;

      return {
        provider: "Supadata",
        urlId: item.id,
        label: item.label,
        success: Boolean(text && text.trim().length > 0),
        latencyMs,
        httpStatus,
        failureType: text?.trim() ? null : "EMPTY_CONTENT",
        outputFormat:
          typeof content === "string"
            ? "plain text (text=true)"
            : Array.isArray(content)
              ? "chunk array {text, offset, duration}"
              : "unknown",
        charCount: text?.length ?? null,
        lang: typeof record.lang === "string" ? record.lang : null,
        sample: text ? text.slice(0, 120).replace(/\s+/g, " ") : null,
        rawError: null,
      };
    }

    const err =
      body && typeof body === "object"
        ? ((body as { error?: string; message?: string }).error ??
          (body as { message?: string }).message ??
          JSON.stringify(body))
        : String(body);

    return {
      provider: "Supadata",
      urlId: item.id,
      label: item.label,
      success: false,
      latencyMs,
      httpStatus,
      failureType: mapSupadataFailure(httpStatus, err),
      outputFormat: null,
      charCount: null,
      lang: null,
      sample: null,
      rawError: err,
    };
  } catch (error) {
    return {
      provider: "Supadata",
      urlId: item.id,
      label: item.label,
      success: false,
      latencyMs: Math.round(performance.now() - start),
      httpStatus,
      failureType: "NETWORK_ERROR",
      outputFormat: null,
      charCount: null,
      lang: null,
      sample: null,
      rawError: error instanceof Error ? error.message : String(error),
    };
  }
}

function mapSupadataFailure(status: number, err: string): string {
  const lower = err.toLowerCase();
  if (status === 206 || lower.includes("transcript-unavailable")) {
    return "NO_CAPTIONS";
  }
  if (status === 404 || lower.includes("not-found")) {
    return "VIDEO_UNAVAILABLE";
  }
  if (status === 401 || lower.includes("unauthorized")) {
    return "AUTH_ERROR";
  }
  return "PROVIDER_ERROR";
}

async function fetchTranscriptApi(
  apiKey: string,
  item: (typeof URLS)[number],
): Promise<SpikeResult> {
  const start = performance.now();
  const videoId = extractVideoId(item.url);
  const params = new URLSearchParams({
    video_url: videoId,
    format: "text",
    include_timestamp: "false",
  });

  let httpStatus = 0;

  try {
    const res = await fetch(
      `https://transcriptapi.com/api/v2/youtube/transcript?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      },
    );
    httpStatus = res.status;
    const body = await res.text();
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      let text = body;
      try {
        const parsed = JSON.parse(body) as {
          transcript?: string | Array<{ text?: string }>;
          language?: string;
        };
        if (typeof parsed.transcript === "string") {
          text = parsed.transcript;
        } else if (Array.isArray(parsed.transcript)) {
          text = parsed.transcript.map((s) => s.text ?? "").join(" ");
        }
        return {
          provider: "TranscriptAPI",
          urlId: item.id,
          label: item.label,
          success: Boolean(text.trim()),
          latencyMs,
          httpStatus,
          failureType: text.trim() ? null : "EMPTY_CONTENT",
          outputFormat: "json transcript[] or text (format=text)",
          charCount: text.length,
          lang: parsed.language ?? null,
          sample: text.slice(0, 120).replace(/\s+/g, " "),
          rawError: null,
        };
      } catch {
        return {
          provider: "TranscriptAPI",
          urlId: item.id,
          label: item.label,
          success: Boolean(text.trim()),
          latencyMs,
          httpStatus,
          failureType: text.trim() ? null : "EMPTY_CONTENT",
          outputFormat: "plain text",
          charCount: text.length,
          lang: null,
          sample: text.slice(0, 120).replace(/\s+/g, " "),
          rawError: null,
        };
      }
    }

    let err = body;
    try {
      const parsed = JSON.parse(body) as { error?: string; message?: string };
      err = parsed.error ?? parsed.message ?? body;
    } catch {
      // keep raw body
    }

    return {
      provider: "TranscriptAPI",
      urlId: item.id,
      label: item.label,
      success: false,
      latencyMs,
      httpStatus,
      failureType: mapTranscriptApiFailure(httpStatus, err),
      outputFormat: null,
      charCount: null,
      lang: null,
      sample: null,
      rawError: err.slice(0, 300),
    };
  } catch (error) {
    return {
      provider: "TranscriptAPI",
      urlId: item.id,
      label: item.label,
      success: false,
      latencyMs: Math.round(performance.now() - start),
      httpStatus,
      failureType: "NETWORK_ERROR",
      outputFormat: null,
      charCount: null,
      lang: null,
      sample: null,
      rawError: error instanceof Error ? error.message : String(error),
    };
  }
}

function mapTranscriptApiFailure(status: number, err: string): string {
  const lower = err.toLowerCase();
  if (
    status === 404 ||
    lower.includes("no caption") ||
    lower.includes("no transcript") ||
    lower.includes("not available")
  ) {
    return "NO_CAPTIONS";
  }
  if (status === 404 && lower.includes("video")) {
    return "VIDEO_UNAVAILABLE";
  }
  if (status === 401) {
    return "AUTH_ERROR";
  }
  return "PROVIDER_ERROR";
}

async function main(): Promise<void> {
  const supadataKey = process.env.SUPADATA_API_KEY?.trim();
  const transcriptApiKey = process.env.TRANSCRIPTAPI_API_KEY?.trim();

  if (!supadataKey && !transcriptApiKey) {
    console.error(
      "Set SUPADATA_API_KEY and/or TRANSCRIPTAPI_API_KEY to run spike.",
    );
    process.exit(1);
  }

  const results: SpikeResult[] = [];

  for (const item of URLS) {
    if (supadataKey) {
      results.push(await fetchSupadata(supadataKey, item));
      await sleep(500);
    }
    if (transcriptApiKey) {
      results.push(await fetchTranscriptApi(transcriptApiKey, item));
      await sleep(500);
    }
  }

  console.log(JSON.stringify(results, null, 2));

  for (const provider of ["Supadata", "TranscriptAPI"] as const) {
    const subset = results.filter((r) => r.provider === provider);
    if (subset.length === 0) continue;
    const successes = subset.filter((r) => r.success).length;
    const avgLatency = Math.round(
      subset.reduce((sum, r) => sum + r.latencyMs, 0) / subset.length,
    );
    console.error(
      `\n${provider}: ${successes}/${subset.length} success, avg latency ${avgLatency}ms`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
