const YOUTUBE_HOST_SUFFIX = "youtube.com";

function hostnameOf(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl.trim());
  } catch {
    return null;
  }
}

export function normalizeYoutubeUrl(url: string): string {
  return url.trim();
}

export function isValidYoutubeUrl(rawUrl: string): boolean {
  const parsed = hostnameOf(rawUrl);
  if (!parsed) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "youtu.be" || host === "www.youtu.be") {
    return parsed.pathname.length > 1;
  }

  if (!host.endsWith(YOUTUBE_HOST_SUFFIX)) {
    return false;
  }

  if (parsed.pathname === "/watch") {
    return Boolean(parsed.searchParams.get("v")?.trim());
  }

  if (parsed.pathname.startsWith("/live/")) {
    return parsed.pathname.length > "/live/".length;
  }

  return false;
}

/**
 * True when the string parses as an http(s) URL whose host is not YouTube.
 * Used to route Facebook/Vimeo/etc. into transcript help tab 3 without guessing
 * among YouTube caption failure modes.
 */
export function isNonYoutubeHostUrl(rawUrl: string): boolean {
  const parsed = hostnameOf(rawUrl);
  if (!parsed) {
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") {
    return false;
  }
  if (host.endsWith(YOUTUBE_HOST_SUFFIX)) {
    return false;
  }

  return host.length > 0;
}

export function extractYoutubeVideoId(rawUrl: string): string | null {
  const trimmed = normalizeYoutubeUrl(rawUrl);
  if (!isValidYoutubeUrl(trimmed)) {
    return null;
  }

  const parsed = new URL(trimmed);
  const host = parsed.hostname.toLowerCase();

  if (host === "youtu.be" || host === "www.youtu.be") {
    return parsed.pathname.slice(1).split("/")[0] || null;
  }

  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v")?.trim() ?? null;
  }

  if (parsed.pathname.startsWith("/live/")) {
    return parsed.pathname.slice("/live/".length).split("/")[0] || null;
  }

  return null;
}
