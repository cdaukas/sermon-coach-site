import { prepCardPoolNote } from "./copy";
import { measure12AddressesNonChristian } from "./counters-address";
import { codeApplicationAsks } from "./counters-coding";
import { measure5OutlineHomogeneous } from "./counters-frame";
import {
  measure4ConclusionFinished,
  measure7HasReciprocalAsk,
} from "./counters-parser";
import { measure6ChristInPoint } from "./counters-measure6";
import {
  COMPUTED_MEASURE_IDS,
  PREP_MEASURE_IDS,
  type PrepMeasureId,
} from "./measures";
import { emptyCountsForIds, rankPrepCard } from "./ranking";
import { detectPrepSourceFormat } from "./text";
import type {
  PrepCardSnapshot,
  PrepMeasureCount,
  PrepSourceFormat,
} from "./types";

export type PrepSermonInput = {
  id: string;
  title: string;
  content: string;
  /** Optional intake hint (e.g. youtube → transcript). */
  intakePath?: string | null;
};

function rate(hits: number, eligible: number): number {
  return eligible > 0 ? hits / eligible : 0;
}

function buildCounts(params: {
  m2Hits: number;
  m2Eligible: number;
  m3Hits: number;
  m3Eligible: number;
  m4Hits: number;
  m4Eligible: number;
  m5Hits: number;
  m5Eligible: number;
  m7Hits: number;
  m7Eligible: number;
  m12Hits: number;
  m12Eligible: number;
}): PrepMeasureCount[] {
  const counts = emptyCountsForIds(PREP_MEASURE_IDS);
  const set = (
    id: PrepMeasureId,
    hits: number | null,
    eligible: number | null,
  ) => {
    const row = counts.find((c) => c.id === id);
    if (!row) {
      return;
    }
    row.hits = hits;
    row.eligible = eligible;
    row.rate =
      hits != null && eligible != null && eligible > 0
        ? rate(hits, eligible)
        : null;
  };

  set(2, params.m2Hits, params.m2Eligible);
  set(3, params.m3Hits, params.m3Eligible);
  set(
    4,
    params.m4Eligible > 0 ? params.m4Hits : null,
    params.m4Eligible > 0 ? params.m4Eligible : null,
  );
  set(
    5,
    params.m5Eligible > 0 ? params.m5Hits : null,
    params.m5Eligible > 0 ? params.m5Eligible : null,
  );
  set(6, null, null);
  set(7, params.m7Hits, params.m7Eligible);
  set(12, params.m12Hits, params.m12Eligible);
  void measure6ChristInPoint;
  return counts;
}

function aggregateSourceFormat(
  formats: Array<"manuscript" | "transcript">,
): PrepSourceFormat {
  if (formats.length === 0) {
    return "unknown";
  }
  const hasMs = formats.some((f) => f === "manuscript");
  const hasTr = formats.some((f) => f === "transcript");
  if (hasMs && hasTr) {
    return "mixed";
  }
  return hasMs ? "manuscript" : "transcript";
}

/**
 * Run the six live counters (+ measure 6 stub) and rank a prep card.
 */
export async function buildPrepCardSnapshot(
  sermons: PrepSermonInput[],
  options?: { apiKey?: string; model?: string; now?: Date },
): Promise<PrepCardSnapshot> {
  const now = options?.now ?? new Date();
  const sampleSize = sermons.length;

  let m4Hits = 0;
  let m4Eligible = 0;
  let m5Hits = 0;
  let m5Eligible = 0;
  let m7Hits = 0;
  let m12Hits = 0;
  const formats: Array<"manuscript" | "transcript"> = [];

  for (const sermon of sermons) {
    const format = detectPrepSourceFormat(sermon.content, sermon.intakePath);
    formats.push(format);

    const finished = measure4ConclusionFinished(
      sermon.content,
      sermon.intakePath,
    );
    if (finished != null) {
      m4Eligible += 1;
      if (finished) {
        m4Hits += 1;
      }
    }

    const homogeneous = measure5OutlineHomogeneous(
      sermon.content,
      sermon.intakePath,
    );
    if (homogeneous != null) {
      m5Eligible += 1;
      if (homogeneous) {
        m5Hits += 1;
      }
    }

    if (measure7HasReciprocalAsk(sermon.content)) {
      m7Hits += 1;
    }

    if (measure12AddressesNonChristian(sermon.content)) {
      m12Hits += 1;
    }
  }

  const coding = await codeApplicationAsks(
    sermons.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      raw: sermon.content,
    })),
    { apiKey: options?.apiKey, model: options?.model },
  );

  const m2Hits = coding.filter((row) => row.namedObject).length;
  const m3Hits = coding.filter((row) => row.namedCost).length;
  const codingEligible = sermons.length;

  const counts = buildCounts({
    m2Hits,
    m2Eligible: codingEligible,
    m3Hits,
    m3Eligible: codingEligible,
    m4Hits,
    m4Eligible,
    m5Hits,
    m5Eligible,
    m7Hits,
    m7Eligible: sampleSize,
    m12Hits,
    m12Eligible: sampleSize,
  });

  const { strengths, focus } = rankPrepCard(counts, { sampleSize });
  const rankedMeasureCount = counts.filter((c) => c.rate != null).length;

  return {
    sampleSize,
    generatedAt: now.toISOString(),
    sourceFormat: aggregateSourceFormat(formats),
    rankedMeasureCount,
    poolNote: prepCardPoolNote(rankedMeasureCount),
    counts,
    strengths,
    focus,
    sermonIds: sermons.map((s) => s.id),
  };
}

export { COMPUTED_MEASURE_IDS };
