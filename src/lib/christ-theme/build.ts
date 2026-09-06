/**
 * Christ theme (Theme 2) report builder.
 * Uses the prep-card surface. Live measures: C3 (8), C4 (11), C5 (12).
 * C1 / C2 stay stubbed and excluded — the face note says so.
 */

import type { PrepSermonInput } from "@/lib/prep-card/build";
import { measure12AddressMatch } from "@/lib/prep-card/counters-address";
import {
  codeCrossNamedObjects,
  measureChristAgencyInPoint,
  measureChristAgencyInProse,
  measureGospelInSkeleton,
  measureGospelInSkeletonMatch,
  type SermonCrossCoding,
} from "@/lib/prep-card/counters-christ";
import { outlinePoints } from "@/lib/prep-card/counters-frame";
import { prepGenreCaveat } from "@/lib/prep-card/genre";
import { verifyQuoteInText } from "@/lib/prep-card/landing-zone";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import { emptyCountsForIds, STRENGTH_RATE_FLOOR } from "@/lib/prep-card/ranking";
import { quoteDedupeKey } from "@/lib/prep-card/select-failure-examples";
import {
  cleanSermonText,
  detectPrepSourceFormat,
} from "@/lib/prep-card/text";
import type {
  PrepCardSnapshot,
  PrepFocusExample,
  PrepMeasureCount,
  PrepRankedMeasure,
  PrepSourceFormat,
  PrepStrengthExample,
} from "@/lib/prep-card/types";
import { rewriteChristFocusExamples } from "./rewrite";

/** Live Christ-theme measure ids (prep-card numbering). */
export const CHRIST_LIVE_MEASURE_IDS: PrepMeasureId[] = [8, 11, 12];

function rate(hits: number, eligible: number): number {
  return eligible > 0 ? hits / eligible : 0;
}

function toRanked(count: PrepMeasureCount): PrepRankedMeasure | null {
  if (
    count.hits == null ||
    count.eligible == null ||
    count.eligible <= 0 ||
    count.rate == null
  ) {
    return null;
  }
  return {
    id: count.id,
    rate: count.rate,
    hits: count.hits,
    eligible: count.eligible,
  };
}

/**
 * Rank within the Christ theme only. All live measures may be strength or focus.
 * Strengths: rate ≥ floor. Focus: lowest rates not already taken as strengths.
 */
export function rankChristTheme(
  counts: readonly PrepMeasureCount[],
  target = 3,
): { strengths: PrepRankedMeasure[]; focus: PrepRankedMeasure[] } {
  const ranked = counts
    .filter((c) => CHRIST_LIVE_MEASURE_IDS.includes(c.id))
    .map(toRanked)
    .filter((row): row is PrepRankedMeasure => row !== null);

  const strengths = [...ranked]
    .filter((row) => row.rate >= STRENGTH_RATE_FLOOR)
    .sort((a, b) => b.rate - a.rate || a.id - b.id)
    .slice(0, target);
  const strengthIds = new Set(strengths.map((row) => row.id));

  const focus = [...ranked]
    .sort((a, b) => a.rate - b.rate || a.id - b.id)
    .filter((row) => !strengthIds.has(row.id))
    .slice(0, target);

  return { strengths, focus };
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

function verifyOrDrop(
  raw: string,
  quote: string,
): { quote: string; offset: number } | null {
  const cleaned = cleanSermonText(raw);
  const offset = verifyQuoteInText(cleaned, quote);
  if (offset == null) {
    return null;
  }
  return { quote, offset };
}

function pickC3Strengths(
  crossCoding: SermonCrossCoding[],
  sermons: PrepSermonInput[],
  used: Set<string>,
  limit = 5,
): PrepStrengthExample[] {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  const out: PrepStrengthExample[] = [];
  for (const row of crossCoding) {
    if (out.length >= limit) {
      break;
    }
    if (!row.namedObject) {
      continue;
    }
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const span of row.spans) {
      if (out.length >= limit || !span.named_object) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, span.quote);
      if (!verified) {
        continue;
      }
      const key = quoteDedupeKey(verified.quote);
      if (used.has(key)) {
        continue;
      }
      used.add(key);
      out.push({
        measureId: 8,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        kind: "quote",
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return out;
}

function pickC4Strengths(
  sermons: PrepSermonInput[],
  used: Set<string>,
  limit = 5,
): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    if (out.length >= limit) {
      break;
    }
    const match = measureGospelInSkeletonMatch(
      sermon.content,
      sermon.intakePath,
    );
    if (!match) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, match);
    if (!verified) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    out.push({
      measureId: 11,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "quote",
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return out;
}

function pickC5Strengths(
  sermons: PrepSermonInput[],
  used: Set<string>,
  limit = 5,
): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const sermon of sermons) {
    if (out.length >= limit) {
      break;
    }
    const match = measure12AddressMatch(sermon.content);
    if (!match) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, match);
    if (!verified) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    out.push({
      measureId: 12,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      kind: "quote",
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return out;
}

function pickC3Failure(
  crossCoding: SermonCrossCoding[],
  sermons: PrepSermonInput[],
  used: Set<string>,
): PrepFocusExample | null {
  const byId = new Map(sermons.map((s) => [s.id, s] as const));
  for (const row of crossCoding) {
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const span of row.spans) {
      if (span.named_object) {
        continue;
      }
      const verified = verifyOrDrop(sermon.content, span.quote);
      if (!verified) {
        continue;
      }
      const key = quoteDedupeKey(verified.quote);
      if (used.has(key)) {
        continue;
      }
      used.add(key);
      return {
        measureId: 8,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
        rewrite: null,
        also: [],
      };
    }
  }
  return null;
}

function pickC4Failure(
  sermons: PrepSermonInput[],
  used: Set<string>,
): PrepFocusExample | null {
  for (const sermon of sermons) {
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    if (measureGospelInSkeleton(sermon.content, sermon.intakePath) !== false) {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const points = outlinePoints(cleaned);
    const point = points[0];
    if (!point) {
      continue;
    }
    const verified = verifyOrDrop(sermon.content, point);
    if (!verified) {
      continue;
    }
    const key = quoteDedupeKey(verified.quote);
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    return {
      measureId: 11,
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
      rewrite: null,
      also: [],
    };
  }
  return null;
}

/**
 * Build a Christ-theme report snapshot for the prep-card surface.
 */
export async function buildChristThemeSnapshot(
  sermons: PrepSermonInput[],
  options?: { apiKey?: string; model?: string; now?: Date },
): Promise<PrepCardSnapshot> {
  void measureChristAgencyInProse;
  void measureChristAgencyInPoint;

  const now = options?.now ?? new Date();
  const sampleSize = sermons.length;
  const formats: Array<"manuscript" | "transcript"> = [];
  let m11Hits = 0;
  let m11Eligible = 0;
  let m12Hits = 0;

  for (const sermon of sermons) {
    formats.push(detectPrepSourceFormat(sermon.content, sermon.intakePath));
    const c4 = measureGospelInSkeleton(sermon.content, sermon.intakePath);
    if (c4 != null) {
      m11Eligible += 1;
      if (c4) {
        m11Hits += 1;
      }
    }
    if (measure12AddressMatch(sermon.content)) {
      m12Hits += 1;
    }
  }

  const codingOpts = { apiKey: options?.apiKey, model: options?.model };
  const crossCoding = await codeCrossNamedObjects(
    sermons.map((s) => ({ id: s.id, title: s.title, raw: s.content })),
    codingOpts,
  );
  const m8Hits = crossCoding.filter((row) => row.namedObject).length;

  const counts = emptyCountsForIds([8, 11, 12]);
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
  set(8, m8Hits, sampleSize);
  set(
    11,
    m11Eligible > 0 ? m11Hits : null,
    m11Eligible > 0 ? m11Eligible : null,
  );
  set(12, m12Hits, sampleSize);

  const { strengths, focus } = rankChristTheme(counts);
  const manuscriptCount = formats.filter((f) => f === "manuscript").length;
  const transcriptCount = formats.filter((f) => f === "transcript").length;

  const used = new Set<string>();
  const strengthExamples: PrepStrengthExample[] = [];
  for (const row of strengths) {
    if (row.id === 8) {
      strengthExamples.push(...pickC3Strengths(crossCoding, sermons, used));
    } else if (row.id === 11) {
      strengthExamples.push(...pickC4Strengths(sermons, used));
    } else if (row.id === 12) {
      strengthExamples.push(...pickC5Strengths(sermons, used));
    }
  }

  const focusExamples: PrepFocusExample[] = [];
  for (const row of focus) {
    let example: PrepFocusExample | null = null;
    if (row.id === 8) {
      example = pickC3Failure(crossCoding, sermons, used);
    } else if (row.id === 11) {
      example = pickC4Failure(sermons, used);
    }
    // C5: no reliable failing span when the habit is absent — omit Was/Now.
    if (example) {
      focusExamples.push(example);
    }
  }

  const rewriteResult = await rewriteChristFocusExamples(
    focusExamples.map((ex) => ({
      measureId: ex.measureId,
      sermonId: ex.sermonId,
      sermonTitle: ex.sermonTitle,
      quote: ex.quote,
      offset: ex.offset,
      marker:
        ex.measureId === 8
          ? "cross_object"
          : ex.measureId === 11
            ? "gospel_point"
            : "outsider_address",
    })),
    codingOpts,
  );
  const rewriteByMeasure = new Map(
    rewriteResult.rewrites.map((row) => [row.measureId, row.rewrite] as const),
  );
  for (const example of focusExamples) {
    example.rewrite = rewriteByMeasure.get(example.measureId) ?? null;
  }

  const genreCaveat = prepGenreCaveat({
    passages: sermons.map((s) => s.primaryPassage ?? null),
    sampleSize,
  });

  const unmeasuredNote =
    `Christ-as-agent in prose and Christ-as-agent in a main point need a dependency parse and are not on this report. ` +
    `This report ran on three measures` +
    (m11Eligible < sampleSize
      ? `; gospel-in-the-skeleton used your ${m11Eligible} manuscripts only (${sampleSize - m11Eligible} transcripts had no outline).`
      : ".");

  const ranked = counts.filter(
    (c) => c.rate != null && c.eligible != null && c.eligible > 0,
  );

  return {
    sampleSize,
    generatedAt: now.toISOString(),
    sourceFormat: aggregateSourceFormat(formats),
    manuscriptCount,
    transcriptCount,
    themeId: "christ",
    rankedMeasureCount: ranked.length,
    poolNote:
      `Christ in the sermon — built from ${ranked.length} live measures on your last ${sampleSize} sermons ` +
      `(${manuscriptCount} manuscripts, ${transcriptCount} transcripts). ` +
      `Does Christ act in this sermon, or is he its destination?`,
    strengthsNote:
      strengths.length === 0
        ? "No Christ-theme measure cleared 50% of its eligible sample, so this report names no strengths rather than inventing them."
        : null,
    genreCaveat,
    unmeasuredNote,
    counts: emptyCountsForIds([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]).map((row) => {
      const live = counts.find((c) => c.id === row.id);
      return live ?? row;
    }),
    strengths,
    focus,
    focusExamples,
    strengthExamples,
    sermonIds: sermons.map((s) => s.id),
    rewriteCostUsd: rewriteResult.estimatedCostUsd,
    rewriteModel: rewriteResult.model || null,
  };
}
