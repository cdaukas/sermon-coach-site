/**
 * Build a movement-report snapshot from a locked baseline and new sermons.
 * Never pools samples. Model writes nothing except ask-coding for counts
 * and quote selection (no rewrites).
 */

import type { PrepSermonInput } from "@/lib/prep-card/build";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import { selectFocusFailureExamples } from "@/lib/prep-card/select-failure-examples";
import { selectStrengthExamples } from "@/lib/prep-card/select-strength-examples";
import { codeApplicationAsks } from "@/lib/prep-card/counters-coding";
import { codeLocalNamings } from "@/lib/prep-card/counters-naming";
import { countMeasuresOnSample } from "./count-sample";
import {
  formatSampleFace,
  heldParagraph,
  heldTryNext,
  movedParagraph,
  movementMeasureLabel,
  slippedParagraph,
} from "./copy";
import { THEME_MEASURES } from "./themes";
import type {
  MovementBaseline,
  MovementCount,
  MovementDisciplineRow,
  MovementQuote,
  MovementReportSnapshot,
} from "./types";
import {
  MOVEMENT_METHOD_NOTE,
  MOVEMENT_MIN_NEW_SERMONS,
  MOVEMENT_STANDING_BLOCK,
} from "./types";
import { computeMovementVerdict } from "./verdict";

function countMap(rows: MovementCount[]): Map<PrepMeasureId, MovementCount> {
  return new Map(rows.map((row) => [row.measureId, row] as const));
}

function asRow(
  measureId: PrepMeasureId,
  baseline: MovementCount,
  comparison: MovementCount,
): MovementDisciplineRow {
  return {
    measureId,
    label: movementMeasureLabel(measureId),
    baseline,
    comparison,
    verdict: computeMovementVerdict({
      baselineHits: baseline.hits,
      baselineEligible: baseline.eligible,
      comparisonHits: comparison.hits,
      comparisonEligible: comparison.eligible,
    }),
  };
}

async function pickWasNow(params: {
  measureId: PrepMeasureId;
  baselineSermons: PrepSermonInput[];
  comparisonSermons: PrepSermonInput[];
  options?: { apiKey?: string; model?: string };
}): Promise<{ was: MovementQuote | null; now: MovementQuote | null }> {
  const { measureId, baselineSermons, comparisonSermons, options } = params;
  const askMeasures = new Set<PrepMeasureId>([2, 3, 7]);
  if (!askMeasures.has(measureId)) {
    return { was: null, now: null };
  }

  const codingOpts = { apiKey: options?.apiKey, model: options?.model };
  const [baselineAsks, comparisonAsks, comparisonNaming] = await Promise.all([
    codeApplicationAsks(
      baselineSermons.map((s) => ({ id: s.id, title: s.title, raw: s.content })),
      codingOpts,
    ),
    codeApplicationAsks(
      comparisonSermons.map((s) => ({
        id: s.id,
        title: s.title,
        raw: s.content,
      })),
      codingOpts,
    ),
    codeLocalNamings(
      comparisonSermons.map((s) => ({
        id: s.id,
        title: s.title,
        raw: s.content,
      })),
      codingOpts,
    ),
  ]);

  const baselineRefs = baselineSermons.map((s) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    intakePath: s.intakePath,
  }));
  const comparisonRefs = comparisonSermons.map((s) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    intakePath: s.intakePath,
  }));

  const failure = selectFocusFailureExamples({
    focusIds: [measureId],
    sermons: baselineRefs,
    askCoding: baselineAsks,
  });
  const primary = failure[0]?.primary;
  const was: MovementQuote | null = primary
    ? {
        sermonId: primary.sermonId,
        sermonTitle: primary.sermonTitle,
        quote: primary.quote,
        offset: primary.offset,
      }
    : null;

  const strength = selectStrengthExamples({
    strengthIds: [measureId === 7 ? 7 : measureId],
    sermons: comparisonRefs,
    askCoding: comparisonAsks,
    namingCoding: comparisonNaming,
  });
  const hit = strength[0];
  const now: MovementQuote | null = hit
    ? {
        sermonId: hit.sermonId,
        sermonTitle: hit.sermonTitle,
        quote: hit.quote,
        offset: hit.offset,
      }
    : null;

  return { was, now };
}

export type BuildMovementResult =
  | { ok: true; snapshot: MovementReportSnapshot }
  | { ok: false; error: "too_few_new"; have: number; need: number };

/**
 * Compare locked baseline counts against counts on sermons preached since.
 * `comparisonSermons` must already exclude baseline ids.
 */
export async function buildMovementReportSnapshot(params: {
  baseline: MovementBaseline;
  baselineSermons: PrepSermonInput[];
  comparisonSermons: PrepSermonInput[];
  options?: { apiKey?: string; model?: string; now?: Date };
}): Promise<BuildMovementResult> {
  const { baseline, baselineSermons, comparisonSermons, options } = params;
  const have = comparisonSermons.length;
  if (have < MOVEMENT_MIN_NEW_SERMONS) {
    return {
      ok: false,
      error: "too_few_new",
      have,
      need: MOVEMENT_MIN_NEW_SERMONS,
    };
  }

  const themeMeasures = THEME_MEASURES[baseline.themeId];
  const focusIds = baseline.focusMeasureIds;
  const unworkedIds = themeMeasures.filter((id) => !focusIds.includes(id));
  const allIds = [...new Set([...focusIds, ...unworkedIds])];

  const comparisonCounts = await countMeasuresOnSample(
    comparisonSermons,
    allIds,
    options,
  );
  const comparisonById = countMap(comparisonCounts);
  const baselineById = countMap(baseline.baselineCounts);

  const empty = (id: PrepMeasureId): MovementCount => ({
    measureId: id,
    hits: 0,
    eligible: 0,
  });

  const disciplines = focusIds.map((id) =>
    asRow(
      id,
      baselineById.get(id) ?? empty(id),
      comparisonById.get(id) ?? empty(id),
    ),
  );
  const unworked = unworkedIds.map((id) =>
    asRow(
      id,
      baselineById.get(id) ?? empty(id),
      comparisonById.get(id) ?? empty(id),
    ),
  );

  const movedDetails = [];
  for (const row of disciplines.filter((d) => d.verdict === "moved")) {
    const { was, now } = await pickWasNow({
      measureId: row.measureId,
      baselineSermons,
      comparisonSermons,
      options,
    });
    movedDetails.push({
      measureId: row.measureId,
      label: row.label,
      baseline: row.baseline,
      comparison: row.comparison,
      was,
      now,
      paragraph: movedParagraph(row.measureId),
    });
  }

  const heldDetails = disciplines
    .filter((d) => d.verdict === "held")
    .map((row) => ({
      measureId: row.measureId,
      label: row.label,
      baseline: row.baseline,
      comparison: row.comparison,
      paragraph: heldParagraph(row.measureId),
      tryNext: heldTryNext(row.measureId),
    }));

  const slippedDetails = disciplines
    .filter((d) => d.verdict === "slipped")
    .map((row) => ({
      measureId: row.measureId,
      label: row.label,
      baseline: row.baseline,
      comparison: row.comparison,
      paragraph: slippedParagraph(row.measureId),
    }));

  const movedCount = disciplines.filter((d) => d.verdict === "moved").length;
  const now = options?.now ?? new Date();

  return {
    ok: true,
    snapshot: {
      themeId: baseline.themeId,
      baselineId: baseline.id,
      generatedAt: now.toISOString(),
      sampleFace: formatSampleFace({
        baselineSize: baseline.sermonIds.length,
        comparisonSize: have,
        sampleLabel: baseline.sampleLabel,
      }),
      baselineSampleSize: baseline.sermonIds.length,
      comparisonSampleSize: have,
      comparisonSermonIds: comparisonSermons.map((s) => s.id),
      disciplines,
      unworked,
      movedDetails,
      heldDetails,
      slippedDetails,
      offerSameTheme: movedCount < 2,
      methodNote: MOVEMENT_METHOD_NOTE,
      standingBlock: MOVEMENT_STANDING_BLOCK,
    },
  };
}
