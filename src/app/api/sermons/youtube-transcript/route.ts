import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkYoutubeFetchRateLimit,
  recordYoutubeFetch,
} from "@/lib/transcripts/rate-limit";
import { fetchYoutubeTranscriptFromSupadata } from "@/lib/transcripts/supadata";
import {
  TRANSCRIPT_SOURCES,
  type TranscriptErrorCode,
  type TranscriptSource,
} from "@/lib/transcripts/types";
import {
  isValidYoutubeUrl,
  normalizeYoutubeUrl,
} from "@/lib/transcripts/youtube-url";

export const runtime = "nodejs";

type RequestBody = {
  url?: unknown;
  source?: unknown;
};

const ERROR_MESSAGES: Record<TranscriptErrorCode, string> = {
  NO_CAPTIONS:
    "This video doesn't have captions we can read yet. If it was streamed in the last day or two, captions may still be processing — try again tomorrow, or paste the transcript below.",
  VIDEO_UNAVAILABLE:
    "We couldn't reach that video. Check that the link is public, or paste the transcript below.",
  PROVIDER_ERROR:
    "Something went wrong on our end. Try again in a minute, or paste the transcript below.",
  RATE_LIMITED:
    "You've hit today's fetch limit. Paste the transcript below, or try again tomorrow.",
  INVALID_URL: "Enter a valid YouTube link (watch, youtu.be, or live).",
  INVALID_SOURCE: "That transcript source is not supported yet.",
  UNAUTHORIZED: "You must be signed in to fetch a transcript.",
  NOT_CONFIGURED: "YouTube transcript fetch is not configured on the server.",
};

function parseSource(value: unknown): TranscriptSource | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim() as TranscriptSource;
  return (TRANSCRIPT_SOURCES as readonly string[]).includes(trimmed)
    ? trimmed
    : null;
}

function errorResponse(
  code: TranscriptErrorCode,
  status: number,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: code, message: ERROR_MESSAGES[code] },
    { status },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHORIZED", 401);
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return errorResponse("INVALID_URL", 400);
  }

  const source = parseSource(body.source);
  if (!source) {
    return errorResponse("INVALID_SOURCE", 400);
  }

  if (source !== "youtube") {
    return errorResponse("INVALID_SOURCE", 400);
  }

  const rawUrl = typeof body.url === "string" ? body.url : "";
  if (!isValidYoutubeUrl(rawUrl)) {
    return errorResponse("INVALID_URL", 400);
  }

  const url = normalizeYoutubeUrl(rawUrl);

  let rateLimit;
  try {
    rateLimit = await checkYoutubeFetchRateLimit(user.id);
  } catch (error) {
    console.error("youtube transcript rate-limit check failed:", error);
    return errorResponse("PROVIDER_ERROR", 500);
  }

  if (!rateLimit.ok) {
    return errorResponse("RATE_LIMITED", 429);
  }

  const result = await fetchYoutubeTranscriptFromSupadata(url);
  if (!result.ok) {
    const status =
      result.code === "NO_CAPTIONS"
        ? 422
        : result.code === "VIDEO_UNAVAILABLE"
          ? 404
          : result.code === "NOT_CONFIGURED"
            ? 503
            : 502;
    return NextResponse.json(
      {
        ok: false,
        error: result.code,
        message: ERROR_MESSAGES[result.code] ?? result.message,
      },
      { status },
    );
  }

  try {
    await recordYoutubeFetch(user.id);
  } catch (error) {
    console.error("youtube transcript fetch log failed:", error);
    return errorResponse("PROVIDER_ERROR", 500);
  }

  return NextResponse.json({ ok: true, transcript: result.transcript });
}
