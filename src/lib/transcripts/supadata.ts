import type {
  FetchYoutubeTranscriptFailure,
  FetchYoutubeTranscriptResult,
} from "./types";

const SUPADATA_API_URL = "https://api.supadata.ai/v1/transcript";

type SupadataChunk = {
  text?: string;
};

type SupadataSuccessBody = {
  content?: string | SupadataChunk[];
  lang?: string;
};

type SupadataErrorBody = {
  error?: string;
  message?: string;
  details?: string;
};

export function isSupadataConfigured(): boolean {
  return Boolean(process.env.SUPADATA_API_KEY?.trim());
}

function getSupadataApiKey(): string | null {
  const apiKey = process.env.SUPADATA_API_KEY?.trim();
  return apiKey || null;
}

export function plainTextFromSupadataContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((chunk) => {
      if (typeof chunk === "object" && chunk && "text" in chunk) {
        return String((chunk as SupadataChunk).text ?? "");
      }
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapSupadataError(
  status: number,
  body: SupadataErrorBody | null,
): FetchYoutubeTranscriptFailure {
  const errorCode = body?.error?.toLowerCase() ?? "";
  const message = body?.message ?? body?.details ?? "Transcript request failed.";

  if (status === 206 || errorCode.includes("transcript-unavailable")) {
    return { ok: false, code: "NO_CAPTIONS", message };
  }

  if (status === 404 || errorCode.includes("not-found")) {
    return { ok: false, code: "VIDEO_UNAVAILABLE", message };
  }

  if (status === 401 || status === 403 || errorCode.includes("unauthorized")) {
    return { ok: false, code: "PROVIDER_ERROR", message: "Provider authentication failed." };
  }

  return { ok: false, code: "PROVIDER_ERROR", message };
}

function mockTranscriptForUrl(url: string): FetchYoutubeTranscriptResult {
  if (url.includes("OrCi6CMutus")) {
    return {
      ok: false,
      code: "NO_CAPTIONS",
      message: "No transcript is available for this video.",
    };
  }

  return {
    ok: true,
    transcript:
      "Mock transcript from Supadata (SUPADATA_API_KEY not configured). Replace with a real key for production fetches.",
  };
}

export async function fetchYoutubeTranscriptFromSupadata(
  url: string,
): Promise<FetchYoutubeTranscriptResult> {
  const apiKey = getSupadataApiKey();
  if (!apiKey) {
    return mockTranscriptForUrl(url);
  }

  const params = new URLSearchParams({
    url,
    text: "true",
    mode: "native",
  });

  let response: Response;
  try {
    response = await fetch(`${SUPADATA_API_URL}?${params.toString()}`, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      code: "PROVIDER_ERROR",
      message: "Could not reach Supadata.",
    };
  }

  let body: SupadataSuccessBody & SupadataErrorBody;
  try {
    body = (await response.json()) as SupadataSuccessBody & SupadataErrorBody;
  } catch {
    return {
      ok: false,
      code: "PROVIDER_ERROR",
      message: "Supadata returned an invalid response.",
    };
  }

  if (!response.ok) {
    return mapSupadataError(response.status, body);
  }

  const transcript = plainTextFromSupadataContent(body.content);
  if (!transcript) {
    return {
      ok: false,
      code: "NO_CAPTIONS",
      message: body.message ?? "No transcript content returned.",
    };
  }

  return { ok: true, transcript };
}
