"use server";

export type GenerateAskThemeResult =
  | { ok: true; cardId: string; sampleSize: number }
  | { ok: false; error: string };

/**
 * The one-click path used to measure the most recent 24 sermons.
 * Reports now come from the deep dive picker.
 */
export async function generateAskThemeAction(): Promise<GenerateAskThemeResult> {
  return {
    ok: false,
    error: "Choose the sermons on Deep dive.",
  };
}
