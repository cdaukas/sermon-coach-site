export const TRANSCRIPT_SOURCES = ["youtube", "podcast_audio"] as const;

export type TranscriptSource = (typeof TRANSCRIPT_SOURCES)[number];

export const YOUTUBE_TRANSCRIPT_SOURCES: TranscriptSource[] = ["youtube"];

export type TranscriptErrorCode =
  | "NO_CAPTIONS"
  | "VIDEO_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "INVALID_URL"
  | "INVALID_SOURCE"
  | "UNAUTHORIZED"
  | "NOT_CONFIGURED";

export type FetchYoutubeTranscriptSuccess = {
  ok: true;
  transcript: string;
};

export type FetchYoutubeTranscriptFailure = {
  ok: false;
  code: TranscriptErrorCode;
  message?: string;
};

export type FetchYoutubeTranscriptResult =
  | FetchYoutubeTranscriptSuccess
  | FetchYoutubeTranscriptFailure;
