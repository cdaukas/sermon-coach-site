import { prepCardPoolNote, prepStrengthsFloorNote } from "./copy";
import { measure12AddressesNonChristian } from "./counters-address";
import {
  christAgencyDetail,
  measure6ChristInPoint,
} from "./counters-agency";
import {
  codeCrossNamedObjects,
  measureGospelInSkeleton,
} from "./counters-christ";
import { codeApplicationAsks } from "./counters-coding";
import { measure5OutlineHomogeneous } from "./counters-frame";
import { codeLocalNamings } from "./counters-naming";
import {
  measure4ConclusionFinished,
  measure7HasReciprocalAsk,
} from "./counters-parser";
import { prepGenreCaveat } from "./genre";
import {
  COMPUTED_MEASURE_IDS,
  isActionableMeasure,
  PREP_MEASURE_IDS,
  type PrepMeasureId,
} from "./measures";
import { emptyCountsForIds, rankPrepCard } from "./ranking";
import { rewriteFocusExamples } from "./rewrite-focus";
import { selectFocusFailureExamples } from "./select-failure-examples";
import { selectStrengthExamples } from "./select-strength-examples";
import { detectPrepSourceFormat } from "./text";
import type {
  PrepCardSnapshot,
  PrepFocusExample,
  PrepMeasureCount,
  PrepSourceFormat,
} from "./types";

export type PrepSermonInput = {
  id: string;
  title: string;
  content: string;
  /** Optional intake hint (e.g. youtube → transcript). */
  intakePath?: string | null;
  /** Optional primary passage for genre caveat. */
  primaryPassage?: string | null;
};

function rate(hits: number, eligible: number): number {
  return eligible > 0 ? hits / eligible : 0;
}

function buildCounts(params: {
  m1Hits: number;
  m1Eligible: number;
  m2Hits: number;
  m2Eligible: number;
  m3Hits: number;
  m3Eligible: number;
  m4Hits: number;
  m4Eligible: number;
  m5Hits: number;
  m5Eligible: number;
  m6Hits: number;
  m6Eligible: number;
  m7Hits: number;
  m7Eligible: number;
  m8Hits: number;
  m8Eligible: number;
  m9Hits: number;
  m9Eligible: number;
  m11Hits: number;
  m11Eligible: number;
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

  set(
    1,
    params.m1Eligible > 0 ? params.m1Hits : null,
    params.m1Eligible > 0 ? params.m1Eligible : null,
  );
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
  set(
    6,
    params.m6Eligible > 0 ? params.m6Hits : null,
    params.m6Eligible > 0 ? params.m6Eligible : null,
  );
  set(7, params.m7Hits, params.m7Eligible);
  set(8, params.m8Hits, params.m8Eligible);
  set(9, params.m9Hits, params.m9Eligible);
  set(
    11,
    params.m11Eligible > 0 ? params.m11Hits : null,
    params.m11Eligible > 0 ? params.m11Eligible : null,
  );
  set(12, params.m12Hits, params.m12Eligible);
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

function unmeasuredOutlineNote(params: {
  sampleSize: number;
  manuscriptCount: number;
  transcriptCount: number;
}): string | null {
  const { sampleSize, manuscriptCount, transcriptCount } = params;
  if (transcriptCount === 0 || manuscriptCount === sampleSize) {
    return null;
  }
  return (
    `Conclusion finish and frame-break ran on your ${manuscriptCount} manuscripts only ` +
    `(${transcriptCount} transcripts had no outline to read).`
  );
}

/**
 * Run live counters and rank a prep card.
 * Actionable computed: 1 (C1), 2, 3, 4, 5, 6 (C2), 7.
 * Strengths-only computed: 8 (C3), 9, 11 (C4), 12 (C5).
 */
export async function buildPrepCardSnapshot(
  sermons: PrepSermonInput[],
  options?: { apiKey?: string; model?: string; now?: Date },
): Promise<PrepCardSnapshot> {
  const now = options?.now ?? new Date();
  const sampleSize = sermons.length;

  let m1Hits = 0;
  let m1Eligible = 0;
  let m4Hits = 0;
  let m4Eligible = 0;
  let m5Hits = 0;
  let m5Eligible = 0;
  let m6Hits = 0;
  let m6Eligible = 0;
  let m7Hits = 0;
  let m11Hits = 0;
  let m11Eligible = 0;
  let m12Hits = 0;
  const formats: Array<"manuscript" | "transcript"> = [];

  for (const sermon of sermons) {
    const format = detectPrepSourceFormat(sermon.content, sermon.intakePath);
    formats.push(format);

    const agency = await christAgencyDetail(sermon.content);
    m1Hits += agency.christSubj;
    m1Eligible += agency.christMentions;

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

    const christPoint = await measure6ChristInPoint(
      sermon.content,
      sermon.intakePath,
    );
    if (christPoint != null) {
      m6Eligible += 1;
      if (christPoint) {
        m6Hits += 1;
      }
    }

    if (measure7HasReciprocalAsk(sermon.content)) {
      m7Hits += 1;
    }

    const gospelSkeleton = measureGospelInSkeleton(
      sermon.content,
      sermon.intakePath,
    );
    if (gospelSkeleton != null) {
      m11Eligible += 1;
      if (gospelSkeleton) {
        m11Hits += 1;
      }
    }

    if (measure12AddressesNonChristian(sermon.content)) {
      m12Hits += 1;
    }
  }

  const codingInputs = sermons.map((sermon) => ({
    id: sermon.id,
    title: sermon.title,
    raw: sermon.content,
  }));
  const codingOpts = { apiKey: options?.apiKey, model: options?.model };

  const [askCoding, namingCoding, crossCoding] = await Promise.all([
    codeApplicationAsks(codingInputs, codingOpts),
    codeLocalNamings(codingInputs, codingOpts),
    codeCrossNamedObjects(codingInputs, codingOpts),
  ]);

  const m2Hits = askCoding.filter((row) => row.namedObject).length;
  const m3Hits = askCoding.filter((row) => row.namedCost).length;
  const m8Hits = crossCoding.filter((row) => row.namedObject).length;
  const m9Hits = namingCoding.filter((row) => row.noFaultNaming).length;
  const codingEligible = sermons.length;

  const counts = buildCounts({
    m1Hits,
    m1Eligible,
    m2Hits,
    m2Eligible: codingEligible,
    m3Hits,
    m3Eligible: codingEligible,
    m4Hits,
    m4Eligible,
    m5Hits,
    m5Eligible,
    m6Hits,
    m6Eligible,
    m7Hits,
    m7Eligible: sampleSize,
    m8Hits,
    m8Eligible: codingEligible,
    m9Hits,
    m9Eligible: codingEligible,
    m11Hits,
    m11Eligible,
    m12Hits,
    m12Eligible: sampleSize,
  });

  const { strengths, focus, strengthTarget, strengthFloorCleared } =
    rankPrepCard(counts, { sampleSize });
  const ranked = counts
    .filter((c) => c.rate != null && c.eligible != null && c.eligible > 0)
    .map((c) => ({ id: c.id, eligible: c.eligible as number }));
  const rankedMeasureCount = ranked.length;
  const actionableRankedCount = ranked.filter((row) =>
    isActionableMeasure(row.id),
  ).length;
  const manuscriptCount = formats.filter((f) => f === "manuscript").length;
  const transcriptCount = formats.filter((f) => f === "transcript").length;

  const sermonRefs = sermons.map((sermon) => ({
    id: sermon.id,
    title: sermon.title,
    content: sermon.content,
    intakePath: sermon.intakePath,
  }));

  // Card-wide quote dedupe: focus Was/also first, then strengths.
  const usedQuotes = new Set<string>();

  const failureBundles = selectFocusFailureExamples({
    focusIds: focus.map((row) => row.id),
    sermons: sermonRefs,
    askCoding,
    usedQuotes,
  });

  const strengthExamples = selectStrengthExamples({
    strengthIds: strengths.map((row) => row.id),
    sermons: sermonRefs,
    askCoding,
    namingCoding,
    usedQuotes,
  });

  // One rewrite per ask-marker Was only. Measures 4 and 5 are evidence
  // only — a conclusion or point head is not rewritten in one line.
  // Pattern-list quotes are never rewritten.
  const rewriteInputs = failureBundles
    .map((bundle) => bundle.primary)
    .filter((example) => example.measureId !== 4 && example.measureId !== 5);
  const rewriteResult = await rewriteFocusExamples(rewriteInputs, codingOpts);
  const rewriteByMeasure = new Map(
    rewriteResult.rewrites.map((row) => [row.measureId, row.rewrite] as const),
  );
  const focusExamples: PrepFocusExample[] = failureBundles.map(
    ({ primary, also }) => ({
      measureId: primary.measureId,
      sermonId: primary.sermonId,
      sermonTitle: primary.sermonTitle,
      quote: primary.quote,
      offset: primary.offset,
      rewrite:
        primary.measureId === 4 || primary.measureId === 5
          ? null
          : (rewriteByMeasure.get(primary.measureId) ?? null),
      also: also.map((row) => ({
        sermonId: row.sermonId,
        sermonTitle: row.sermonTitle,
        quote: row.quote,
        offset: row.offset,
      })),
    }),
  );

  if (rewriteResult.estimatedCostUsd != null) {
    console.info(
      `[prep_card] rewrite call model=${rewriteResult.model} cost_usd=${rewriteResult.estimatedCostUsd.toFixed(4)}`,
    );
  }

  const genreCaveat = prepGenreCaveat({
    passages: sermons.map((s) => s.primaryPassage ?? null),
    sampleSize,
  });
  const unmeasuredNote = unmeasuredOutlineNote({
    sampleSize,
    manuscriptCount,
    transcriptCount,
  });

  return {
    sampleSize,
    generatedAt: now.toISOString(),
    sourceFormat: aggregateSourceFormat(formats),
    manuscriptCount,
    transcriptCount,
    rankedMeasureCount,
    poolNote: prepCardPoolNote({
      sampleSize,
      manuscriptCount,
      transcriptCount,
      ranked,
      actionableRankedCount,
    }),
    strengthsNote: prepStrengthsFloorNote({
      shown: strengths.length,
      target: strengthTarget,
      clearedFloor: strengthFloorCleared,
    }),
    genreCaveat,
    unmeasuredNote,
    counts,
    strengths,
    focus,
    focusExamples,
    strengthExamples,
    sermonIds: sermons.map((s) => s.id),
    rewriteCostUsd: rewriteResult.estimatedCostUsd,
    rewriteModel: rewriteResult.model || null,
  };
}

export { COMPUTED_MEASURE_IDS };
