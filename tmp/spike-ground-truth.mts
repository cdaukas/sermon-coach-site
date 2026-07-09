import { YoutubeTranscript } from "youtube-transcript";

const URLS = [
  ["H0Iuk3LBbq0", "Santa Cruz Baptist"],
  ["mZd-pJ7xOps", "Living Stones full service"],
  ["SVe7s1P05i4", "Gilbert Bible John 5"],
  ["NPJfTJj_40w", "El Redil Spanish"],
  ["OrCi6CMutus", "Gilbert fresh livestream"],
] as const;

for (const [id, label] of URLS) {
  const start = performance.now();
  try {
    const chunks = await YoutubeTranscript.fetchTranscript(id);
    const text = chunks.map((c) => c.text).join(" ");
    console.log(
      JSON.stringify({
        id,
        label,
        success: true,
        latencyMs: Math.round(performance.now() - start),
        segments: chunks.length,
        chars: text.length,
        lang: chunks[0]?.lang ?? null,
        sample: text.slice(0, 100).replace(/\s+/g, " "),
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        id,
        label,
        success: false,
        latencyMs: Math.round(performance.now() - start),
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
