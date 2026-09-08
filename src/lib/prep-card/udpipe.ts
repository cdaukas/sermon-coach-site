/**
 * UDPipe WASM singleton for Christ-agency (C1 / C2) dependency parses.
 * Server-only. Do not import from client components.
 *
 * Calibration (17 validation manuscripts, 2026-09-06):
 * Pearson r = 0.964 vs spaCy en_core_web_sm christ_agency
 * (spaCy itself r ≈ 0.925 / 0.903 vs hand coding; κ = 1.000 on 520 spans).
 * Token alignment left 41 mentions unmatched (21 spaCy-only, 20 UDPipe-only).
 */

import type { UDPipe } from "udpipe-node/wasm";
import type { UDSentence, UDWord } from "udpipe-node";

let engine: UDPipe | null = null;
let loading: Promise<UDPipe> | null = null;

export async function getUdpipe(): Promise<UDPipe> {
  if (engine) {
    return engine;
  }
  if (!loading) {
    loading = (async () => {
      const { createUDPipe } = await import("udpipe-node/wasm");
      engine = createUDPipe();
      return engine;
    })();
  }
  return loading;
}

export type UdpipeWord = UDWord & { start: number | null; end: number | null };

/**
 * Parse text and recover character offsets by sequential search.
 * Offset recovery is best-effort; some tokens may lack starts.
 */
export function parseWithOffsets(
  nlp: UDPipe,
  text: string,
): Array<{ sentence: UDSentence; words: UdpipeWord[] }> {
  const clipped = text.slice(0, 900_000);
  const sentences = nlp.parse(clipped);
  let cursor = 0;
  return sentences.map((sentence) => {
    const rawWords = (sentence.words ?? []).filter(
      (w): w is UDWord => typeof w.id === "number",
    );
    const words: UdpipeWord[] = rawWords.map((w) => {
      const idx = clipped.indexOf(w.form, cursor);
      if (idx < 0) {
        const lower = clipped.toLowerCase();
        const i2 = lower.indexOf(w.form.toLowerCase(), cursor);
        if (i2 < 0) {
          return { ...w, start: null, end: null };
        }
        cursor = i2 + w.form.length;
        return { ...w, start: i2, end: i2 + w.form.length };
      }
      cursor = idx + w.form.length;
      return { ...w, start: idx, end: idx + w.form.length };
    });
    return { sentence, words };
  });
}

/** Calibration snapshot from the spaCy comparison probe. */
export const UDPIPE_SPACY_CALIBRATION = {
  pearsonR: 0.964,
  spacyVsHandR: [0.925, 0.903] as const,
  matchedMentions: 360,
  labelDisagree: 18,
  /** spaCy mentions with no UDPipe align. */
  spacyOnly: 21,
  /** UDPipe mentions with no spaCy align. */
  udpipeOnly: 20,
  get unalignedTotal() {
    return this.spacyOnly + this.udpipeOnly;
  },
} as const;

/**
 * Flag when spaCy↔UDPipe token-alignment imbalance skews materially.
 * Balanced on the calibration set (21 vs 20). Warn if either side is
 * more than 2× the other and the gap is at least 15 mentions.
 */
export function alignmentImbalanceFlag(
  spacyOnly: number,
  udpipeOnly: number,
): string | null {
  const total = spacyOnly + udpipeOnly;
  if (total < 15) {
    return null;
  }
  const hi = Math.max(spacyOnly, udpipeOnly);
  const lo = Math.min(spacyOnly, udpipeOnly);
  if (lo === 0 ? hi >= 15 : hi / lo >= 2 && hi - lo >= 15) {
    const side = spacyOnly > udpipeOnly ? "spaCy-only" : "UDPipe-only";
    return (
      `UDPipe↔spaCy alignment imbalance: ${spacyOnly} spaCy-only vs ` +
      `${udpipeOnly} UDPipe-only (${side} heavy). Re-check tokenization before trusting C1.`
    );
  }
  return null;
}

export function christAgencyMethodNote(params?: {
  manuscriptEligible?: number;
  sampleSize?: number;
  transcriptCount?: number;
}): string {
  const cal = UDPIPE_SPACY_CALIBRATION;
  let note =
    `Christ-as-agent measures use UDPipe (WASM, English GUM UD 2.5), not spaCy. ` +
    `UDPipe tracks the spaCy implementation at Pearson r = ${cal.pearsonR} ` +
    `(spaCy itself is r ≈ ${cal.spacyVsHandR[0]} / ${cal.spacyVsHandR[1]} against hand coding). ` +
    `Known limitation: ${cal.unalignedTotal} Christ mentions did not align between parsers ` +
    `on the validation set (${cal.spacyOnly} spaCy-only, ${cal.udpipeOnly} UDPipe-only; nearly balanced).`;
  const imbalance = alignmentImbalanceFlag(cal.spacyOnly, cal.udpipeOnly);
  if (imbalance) {
    note += ` ${imbalance}`;
  }
  if (
    params?.manuscriptEligible != null &&
    params.sampleSize != null &&
    params.manuscriptEligible < params.sampleSize
  ) {
    note +=
      ` Christ-in-a-main-point and gospel-in-the-skeleton used your ` +
      `${params.manuscriptEligible} manuscripts only` +
      (params.transcriptCount != null
        ? ` (${params.transcriptCount} transcripts had no outline).`
        : ".");
  }
  return note;
}
