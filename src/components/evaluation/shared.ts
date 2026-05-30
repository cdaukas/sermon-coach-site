export const serifFont = { fontFamily: "var(--font-serif)" };
export const uiFont = { fontFamily: "var(--font-ui)" };

/** SKILL.md / rubric heat-map register colors (14 registers). */
const BEAT_REGISTER_COLORS: Record<string, string> = {
  humor: "#d4a857",
  diagnostic: "#6b7a8f",
  declarative: "#4a6584",
  reverent: "#5a4a6b",
  pastoral: "#7a8f6b",
  awe: "#6b4a7a",
  encouragement: "#8aa37a",
  convicting: "#a04848",
  doxological: "#c9892e",
  teaching: "#a8a59a",
  climactic: "#4a7c59",
  invitation: "#c98a4a",
  tender: "#6b4a4a",
  info: "#8a8a82",
};

export function beatBackgroundColor(register: string): string {
  return BEAT_REGISTER_COLORS[register.toLowerCase()] ?? "#6b7a8f";
}

export function beatHasMismatch(textSupports: string): boolean {
  return textSupports === "mismatch";
}

export function textSupportTone(
  textSupport: "strong" | "ok" | "yes" | "partial" | "mismatch" | string,
): "match" | "partial" {
  if (textSupport === "partial" || textSupport === "mismatch") return "partial";
  return "match";
}

export function textSupportLabel(
  textSupport: "strong" | "ok" | "yes" | "partial" | "mismatch" | string,
): string {
  switch (textSupport) {
    case "strong":
      return "✓ Strong";
    case "ok":
    case "yes":
      return "✓";
    case "partial":
      return "⚠ Partial";
    case "mismatch":
      return "✗ Mismatch";
    default:
      return "✓";
  }
}

function parseClockToSeconds(clock: string): number {
  const parts = clock.trim().split(":").map((p) => Number.parseInt(p, 10));
  if (parts.length === 1 && !Number.isNaN(parts[0])) {
    return parts[0] * 60;
  }
  const [minutes, seconds = 0] = parts;
  if (Number.isNaN(minutes)) return 0;
  return minutes * 60 + (Number.isNaN(seconds) ? 0 : seconds);
}

/** Duration in seconds from a beat `time_range` like "18:00–21:10". */
export function parseBeatTimeRangeSeconds(timeRange: string): number {
  const segments = timeRange.split(/[–—-]/).map((s) => s.trim());
  if (segments.length < 2) return 60;
  const start = parseClockToSeconds(segments[0]);
  const end = parseClockToSeconds(segments[1]);
  return Math.max(end - start, 1);
}

export function formatLengthMinutes(minutes: number): string {
  return `~${minutes} minutes`;
}

/** Progress bar fill color: green 4–5, amber 3, red 1–2 (reference dashboard). */
export function criterionScoreColor(score: number): string {
  if (score >= 4) return "var(--sc-green)";
  if (score === 3) return "var(--sc-amber)";
  return "var(--sc-red)";
}

/** Progress bar fill width as a percentage of track (score 1–5 → 20%–100%). */
export function criterionScoreFillPercent(score: number): number {
  return Math.min(5, Math.max(1, score)) * 20;
}

/** Split "Opener: body" improvement copy for headline verdict typography. */
export function splitVerdictImprovement(sentence: string): {
  opener: string;
  body: string;
} {
  const match = sentence.match(/^(.+?:)\s+([\s\S]+)$/);
  if (match) {
    return { opener: match[1], body: match[2] };
  }
  return {
    opener: "The single highest-leverage change for the next sermon:",
    body: sentence,
  };
}
