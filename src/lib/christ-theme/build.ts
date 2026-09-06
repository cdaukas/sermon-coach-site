/**
 * Christ theme (Theme 2) report builder.
 * Uses the prep-card surface. Live: C1 (1), C2 (6), C3 (8), C4 (11), C5 (12).
 * C1/C2 via UDPipe — see christAgencyMethodNote.
 */

import type { PrepSermonInput } from "@/lib/prep-card/build";
import { measure12AddressMatch } from "@/lib/prep-card/counters-address";
import {
  christAgencyDetail,
  christAgencyInPointsDetail,
  type ChristAgencyResult,
  type ChristPointAgency,
} from "@/lib/prep-card/counters-agency";
import {
  codeCrossNamedObjects,
  measureGospelInSkeleton,
  measureGospelInSkeletonMatch,
  type SermonCrossCoding,
} from "@/lib/prep-card/counters-christ";
import { quotableMainPoints } from "@/lib/prep-card/counters-frame";
import { prepGenreCaveat } from "@/lib/prep-card/genre";
import { verifyQuoteInText } from "@/lib/prep-card/landing-zone";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import { emptyCountsForIds, STRENGTH_RATE_FLOOR } from "@/lib/prep-card/ranking";
import {
  FOCUS_ALSO_CAP,
  quoteDedupeKey,
} from "@/lib/prep-card/select-failure-examples";
import { STRENGTH_EVIDENCE_CAP } from "@/lib/prep-card/select-strength-examples";
import {
  cleanSermonText,
  detectPrepSourceFormat,
} from "@/lib/prep-card/text";
import type {
  PrepCardSnapshot,
  PrepFocusAlsoQuote,
  PrepFocusExample,
  PrepMeasureCount,
  PrepRankedMeasure,
  PrepSourceFormat,
  PrepStrengthExample,
} from "@/lib/prep-card/types";
import { christAgencyMethodNote } from "@/lib/prep-card/udpipe";
import { rewriteChristFocusExamples } from "./rewrite";

/** Live Christ-theme measure ids (prep-card numbering). */
export const CHRIST_LIVE_MEASURE_IDS: PrepMeasureId[] = [1, 6, 8, 11, 12];

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

type SermonAgency = {
  sermon: PrepSermonInput;
  prose: ChristAgencyResult;
  points: ChristPointAgency | null;
};

function pickC1Strengths(
  rows: SermonAgency[],
  used: Set<string>,
  limit = STRENGTH_EVIDENCE_CAP,
): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const row of rows) {
    if (out.length >= limit) {
      break;
    }
    for (const mention of row.prose.mentions) {
      if (out.length >= limit || !mention.agent || !mention.sentence) {
        continue;
      }
      const verified = verifyOrDrop(row.sermon.content, mention.sentence);
      if (!verified) {
        continue;
      }
      const key = quoteDedupeKey(verified.quote);
      if (used.has(key)) {
        continue;
      }
      used.add(key);
      out.push({
        measureId: 1,
        sermonId: row.sermon.id,
        sermonTitle: row.sermon.title,
        kind: "quote",
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return out;
}

type FailureCandidate = {
  sermonId: string;
  sermonTitle: string;
  quote: string;
  offset: number;
};

function toFocusExample(
  measureId: PrepMeasureId,
  rows: FailureCandidate[],
): PrepFocusExample | null {
  if (rows.length === 0) {
    return null;
  }
  const [primary, ...rest] = rows;
  const also: PrepFocusAlsoQuote[] = rest.slice(0, FOCUS_ALSO_CAP).map((row) => ({
    sermonId: row.sermonId,
    sermonTitle: row.sermonTitle,
    quote: row.quote,
    offset: row.offset,
  }));
  return {
    measureId,
    sermonId: primary!.sermonId,
    sermonTitle: primary!.sermonTitle,
    quote: primary!.quote,
    offset: primary!.offset,
    rewrite: null,
    also,
  };
}

function claimVerified(
  raw: string,
  quote: string,
  used: Set<string>,
): { quote: string; offset: number } | null {
  const verified = verifyOrDrop(raw, quote);
  if (!verified) {
    return null;
  }
  const key = quoteDedupeKey(verified.quote);
  if (used.has(key)) {
    return null;
  }
  used.add(key);
  return verified;
}

function pickC1Failure(
  rows: SermonAgency[],
  used: Set<string>,
): PrepFocusExample | null {
  const limit = 1 + FOCUS_ALSO_CAP;
  const candidates: FailureCandidate[] = [];
  for (const row of rows) {
    if (candidates.length >= limit) {
      break;
    }
    for (const mention of row.prose.mentions) {
      if (candidates.length >= limit || mention.agent || !mention.sentence) {
        continue;
      }
      const verified = claimVerified(
        row.sermon.content,
        mention.sentence,
        used,
      );
      if (!verified) {
        continue;
      }
      candidates.push({
        sermonId: row.sermon.id,
        sermonTitle: row.sermon.title,
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return toFocusExample(1, candidates);
}

function pickC2Strengths(
  rows: SermonAgency[],
  used: Set<string>,
  limit = STRENGTH_EVIDENCE_CAP,
): PrepStrengthExample[] {
  const out: PrepStrengthExample[] = [];
  for (const row of rows) {
    if (out.length >= limit || !row.points) {
      continue;
    }
    for (const point of row.points.agentPoints) {
      if (out.length >= limit) {
        break;
      }
      const verified = claimVerified(row.sermon.content, point, used);
      if (!verified) {
        continue;
      }
      out.push({
        measureId: 6,
        sermonId: row.sermon.id,
        sermonTitle: row.sermon.title,
        kind: "quote",
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return out;
}

function pickC2Failure(
  rows: SermonAgency[],
  used: Set<string>,
): PrepFocusExample | null {
  const limit = 1 + FOCUS_ALSO_CAP;
  const candidates: FailureCandidate[] = [];
  for (const row of rows) {
    if (candidates.length >= limit || !row.points) {
      continue;
    }
    if (row.points.pointsChristAgent > 0) {
      continue;
    }
    const point =
      row.points.namingNonAgentPoints[0] ??
      quotableMainPoints(cleanSermonText(row.sermon.content))[0] ??
      null;
    if (!point) {
      continue;
    }
    const verified = claimVerified(row.sermon.content, point, used);
    if (!verified) {
      continue;
    }
    candidates.push({
      sermonId: row.sermon.id,
      sermonTitle: row.sermon.title,
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return toFocusExample(6, candidates);
}

function pickC3Strengths(
  crossCoding: SermonCrossCoding[],
  sermons: PrepSermonInput[],
  used: Set<string>,
  limit = STRENGTH_EVIDENCE_CAP,
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
      const verified = claimVerified(sermon.content, span.quote, used);
      if (!verified) {
        continue;
      }
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
  limit = STRENGTH_EVIDENCE_CAP,
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
    const verified = claimVerified(sermon.content, match, used);
    if (!verified) {
      continue;
    }
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
  limit = STRENGTH_EVIDENCE_CAP,
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
    const verified = claimVerified(sermon.content, match, used);
    if (!verified) {
      continue;
    }
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
  const limit = 1 + FOCUS_ALSO_CAP;
  const candidates: FailureCandidate[] = [];
  for (const row of crossCoding) {
    if (candidates.length >= limit) {
      break;
    }
    const sermon = byId.get(row.sermonId);
    if (!sermon) {
      continue;
    }
    for (const span of row.spans) {
      if (candidates.length >= limit || span.named_object) {
        continue;
      }
      const verified = claimVerified(sermon.content, span.quote, used);
      if (!verified) {
        continue;
      }
      candidates.push({
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        quote: verified.quote,
        offset: verified.offset,
      });
    }
  }
  return toFocusExample(8, candidates);
}

function pickC4Failure(
  sermons: PrepSermonInput[],
  used: Set<string>,
): PrepFocusExample | null {
  const limit = 1 + FOCUS_ALSO_CAP;
  const candidates: FailureCandidate[] = [];
  for (const sermon of sermons) {
    if (candidates.length >= limit) {
      break;
    }
    if (detectPrepSourceFormat(sermon.content, sermon.intakePath) !== "manuscript") {
      continue;
    }
    if (measureGospelInSkeleton(sermon.content, sermon.intakePath) !== false) {
      continue;
    }
    const cleaned = cleanSermonText(sermon.content);
    const point = quotableMainPoints(cleaned)[0];
    if (!point) {
      continue;
    }
    const verified = claimVerified(sermon.content, point, used);
    if (!verified) {
      continue;
    }
    candidates.push({
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      quote: verified.quote,
      offset: verified.offset,
    });
  }
  return toFocusExample(11, candidates);
}

/**
 * Build a Christ-theme report snapshot for the prep-card surface.
 */
export async function buildChristThemeSnapshot(
  sermons: PrepSermonInput[],
  options?: { apiKey?: string; model?: string; now?: Date },
): Promise<PrepCardSnapshot> {
  const now = options?.now ?? new Date();
  const sampleSize = sermons.length;
  const formats: Array<"manuscript" | "transcript"> = [];
  let m11Hits = 0;
  let m11Eligible = 0;
  let m12Hits = 0;
  let m1Subj = 0;
  let m1Mentions = 0;
  let m6Hits = 0;
  let m6Eligible = 0;

  const agencyRows: SermonAgency[] = [];

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

    const prose = await christAgencyDetail(sermon.content);
    m1Subj += prose.christSubj;
    m1Mentions += prose.christMentions;
    const points = await christAgencyInPointsDetail(
      sermon.content,
      sermon.intakePath,
    );
    if (points != null) {
      m6Eligible += 1;
      if (points.pointsChristAgent > 0) {
        m6Hits += 1;
      }
    }
    agencyRows.push({ sermon, prose, points });
  }

  const codingOpts = { apiKey: options?.apiKey, model: options?.model };
  const crossCoding = await codeCrossNamedObjects(
    sermons.map((s) => ({ id: s.id, title: s.title, raw: s.content })),
    codingOpts,
  );
  const m8Hits = crossCoding.filter((row) => row.namedObject).length;

  const counts = emptyCountsForIds([1, 6, 8, 11, 12]);
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
  set(1, m1Mentions > 0 ? m1Subj : null, m1Mentions > 0 ? m1Mentions : null);
  set(
    6,
    m6Eligible > 0 ? m6Hits : null,
    m6Eligible > 0 ? m6Eligible : null,
  );
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
  // Card-wide quote dedupe: focus Was/also first, then strengths.
  const focusExamples: PrepFocusExample[] = [];
  for (const row of focus) {
    let example: PrepFocusExample | null = null;
    if (row.id === 1) {
      example = pickC1Failure(agencyRows, used);
    } else if (row.id === 6) {
      example = pickC2Failure(agencyRows, used);
    } else if (row.id === 8) {
      example = pickC3Failure(crossCoding, sermons, used);
    } else if (row.id === 11) {
      example = pickC4Failure(sermons, used);
    }
    // C5: no reliable failing span when the habit is absent — omit Was/Now/also.
    if (example) {
      focusExamples.push(example);
    }
  }

  const strengthExamples: PrepStrengthExample[] = [];
  for (const row of strengths) {
    if (row.id === 1) {
      strengthExamples.push(...pickC1Strengths(agencyRows, used));
    } else if (row.id === 6) {
      strengthExamples.push(...pickC2Strengths(agencyRows, used));
    } else if (row.id === 8) {
      strengthExamples.push(...pickC3Strengths(crossCoding, sermons, used));
    } else if (row.id === 11) {
      strengthExamples.push(...pickC4Strengths(sermons, used));
    } else if (row.id === 12) {
      strengthExamples.push(...pickC5Strengths(sermons, used));
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
        ex.measureId === 1
          ? "christ_agent_prose"
          : ex.measureId === 6
            ? "christ_agent_point"
            : ex.measureId === 8
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

  const unmeasuredNote = christAgencyMethodNote({
    manuscriptEligible: m6Eligible,
    sampleSize,
    transcriptCount,
  });

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
      `Built from ${ranked.length} live measures on your last ${sampleSize} sermons ` +
      `(${manuscriptCount} manuscripts, ${transcriptCount} transcripts).`,
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
