import { z } from "zod";
import { VERDICT_STRICT_CAPS_FROM } from "./prompt";
import { CANONICAL_CRITERION_NAMES } from "./tool-schema";
import { normalizeLegacyEvaluationResult } from "./schema-legacy";

// ---------------------------------------------------------------------------
// Strict v2 (SCHEMA_SPEC) — Claude tool output; keep in sync with tool-schema.ts
// ---------------------------------------------------------------------------

export const submissionModeStrictSchema = z.enum(["manuscript", "transcript"]);

export const scoreBandSchema = z.enum([
  "Exemplary",
  "Strong",
  "Faithful",
  "Needs Improvement",
  "Significant Concerns",
]);

export const scoreLetterSchema = z.enum(["A", "B", "C", "D", "F"]);

const criterionNameSchema = z.enum(CANONICAL_CRITERION_NAMES);

/** id → canonical name (SCHEMA_SPEC criterion list). */
export const CANONICAL_CRITERION_BY_ID: Record<
  number,
  (typeof CANONICAL_CRITERION_NAMES)[number]
> = {
  1: "Textual fidelity & exegesis",
  2: "Christ-centered / redemptive arc",
  3: "Gospel clarity",
  4: "Fallen Condition Focus",
  5: "Structure",
  6: "Hard things handled",
  7: "Application to present audience",
  8: "Heat Map: emotional delivery",
  9: "Pastoral specificity",
  10: "Ecclesial faithfulness",
  11: "Expository exultation",
};

const EXPECTED_CRITERION_IDS_BY_CATEGORY: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11],
};

/** Load-bearing criteria (SCHEMA_SPEC) — counted twice in weighted_raw. */
export const DOUBLE_WEIGHTED_CRITERION_IDS: ReadonlySet<number> = new Set([
  3, 4, 7,
]);

export const SCORING_RAW_MAX = 55 as const;
export const WEIGHTED_RAW_MAX = 70 as const;

export function isDoubleWeightedCriterion(id: number): boolean {
  return DOUBLE_WEIGHTED_CRITERION_IDS.has(id);
}

/** Extra points added to simple total for weighted_raw (scores for #3, #4, #7). */
export function doubleWeightedBonus(
  scoresById: Readonly<Record<number, number>>,
): number {
  let bonus = 0;
  for (const id of DOUBLE_WEIGHTED_CRITERION_IDS) {
    bonus += scoresById[id] ?? 0;
  }
  return bonus;
}

export function compositeWeightedFromWeightedRaw(weightedRaw: number): number {
  return Math.round((weightedRaw * SCORING_RAW_MAX) / WEIGHTED_RAW_MAX);
}

export const categoryIdSchema = z.enum([
  "text_and_theology",
  "structure_and_craft",
  "application_and_audience",
  "ecclesial_and_spiritual",
]);

export const evaluationMetaStrictSchema = z.object({
  sermon_title: z.string(),
  scripture_reference: z.string(),
  preacher_name: z.string().nullable(),
  church_or_context: z.string().nullable(),
  estimated_length_minutes: z.number().int().positive(),
  series_name: z.string().nullable(),
  submission_mode: submissionModeStrictSchema,
  audio_available: z.boolean(),
});

export const evaluationScoringStrictSchema = z.object({
  composite_simple: z.number().int().min(11).max(55),
  composite_weighted: z.number().int().min(11).max(55),
  band: scoreBandSchema,
  raw_total: z.number().int().min(11).max(55),
  raw_max: z.literal(55),
});

function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Double quotation marks only — possessive apostrophes (U+0027) are allowed. */
export const VERDICT_QUOTATION_MARK_PATTERN = /["\u201C\u201D]/;

export const verdictNoQuotesRefine = {
  affirmation: (s: string) => !VERDICT_QUOTATION_MARK_PATTERN.test(s),
  improvement: (s: string) => !VERDICT_QUOTATION_MARK_PATTERN.test(s),
} as const;

/** Read path for v2.0–v2.2 rows: shape + no quotes; no word caps. */
export const evaluationVerdictReadGrandfatherSchema = z.object({
  affirmation: z
    .string()
    .min(1, "Verdict affirmation is required")
    .refine(verdictNoQuotesRefine.affirmation, {
      message:
        "Verdict affirmation must not contain quotation marks — quotes are body work, not verdict work (SKILL.md self-check item 7).",
    }),
  improvement: z
    .string()
    .min(1, "Verdict improvement is required")
    .refine(verdictNoQuotesRefine.improvement, {
      message:
        "Verdict improvement must not contain quotation marks — quotes are body work.",
    }),
});

/** Write path + read for prompt_version >= v2.3 — SCHEMA_SPEC hard caps. */
export const evaluationVerdictPersistSchema = z.object({
  affirmation: z
    .string()
    .min(1, "Verdict affirmation is required")
    .refine((s) => countWords(s) <= 80, {
      message:
        "Verdict affirmation must be 80 words or fewer (canon target ~50-60). The verdict is pastoral framing; the body does the detail work.",
    })
    .refine(verdictNoQuotesRefine.affirmation, {
      message:
        "Verdict affirmation must not contain quotation marks — quotes are body work, not verdict work (SKILL.md self-check item 7).",
    }),
  improvement: z
    .string()
    .min(1, "Verdict improvement is required")
    .refine((s) => countWords(s) <= 80, {
      message:
        "Verdict improvement must be 80 words or fewer (canon target ~25-30; headline pointer with one qualifying clause, not an explanation).",
    })
    .refine(verdictNoQuotesRefine.improvement, {
      message:
        "Verdict improvement must not contain quotation marks — quotes are body work.",
    }),
});

/** @deprecated alias — use evaluationVerdictPersistSchema */
export const evaluationVerdictStrictSchema = evaluationVerdictPersistSchema;

export const anchoredQuoteStrictSchema = z.object({
  text: z.string(),
  approximate_location: z.string(),
});

export const evaluationCriterionStrictSchema = z
  .object({
    id: z.number().int().min(1).max(11),
    name: criterionNameSchema,
    category: z.number().int().min(1).max(4),
    tradition_tag: z.string(),
    score: z.number().int().min(1).max(5),
    narrative: z.string(),
    anchored_quote: anchoredQuoteStrictSchema.nullable().optional(),
  })
  .transform((criterion) => ({
    ...criterion,
    is_double_weighted: isDoubleWeightedCriterion(criterion.id),
  }));

function refineCategoryCriteria(
  criteria: z.infer<typeof evaluationCriterionStrictSchema>[],
  categoryNumber: number,
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  const expectedIds = EXPECTED_CRITERION_IDS_BY_CATEGORY[categoryNumber];
  const seenIds = new Set<number>();

  for (let i = 0; i < criteria.length; i++) {
    const c = criteria[i];
    const basePath = [...pathPrefix, "criteria", i];

    if (c.category !== categoryNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `category must be ${categoryNumber} for this dashboard`,
        path: [...basePath, "category"],
      });
    }

    if (!expectedIds.includes(c.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `criterion id ${c.id} does not belong in category ${categoryNumber}`,
        path: [...basePath, "id"],
      });
    }

    if (CANONICAL_CRITERION_BY_ID[c.id] !== c.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `name must be "${CANONICAL_CRITERION_BY_ID[c.id]}" for id ${c.id}`,
        path: [...basePath, "name"],
      });
    }

    if (seenIds.has(c.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate criterion id ${c.id}`,
        path: [...basePath, "id"],
      });
    }
    seenIds.add(c.id);
  }

  for (const expectedId of expectedIds) {
    if (!seenIds.has(expectedId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `missing criterion id ${expectedId}`,
        path: [...pathPrefix, "criteria"],
      });
    }
  }
}

const category1StrictSchema = z
  .object({
    id: z.literal("text_and_theology"),
    name: z.string(),
    number: z.literal(1),
    criteria: z.tuple([
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
    ]),
  })
  .superRefine((cat, ctx) => refineCategoryCriteria(cat.criteria, 1, ctx, []));

const category2StrictSchema = z
  .object({
    id: z.literal("structure_and_craft"),
    name: z.string(),
    number: z.literal(2),
    criteria: z.tuple([
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
    ]),
  })
  .superRefine((cat, ctx) => refineCategoryCriteria(cat.criteria, 2, ctx, []));

const category3StrictSchema = z
  .object({
    id: z.literal("application_and_audience"),
    name: z.string(),
    number: z.literal(3),
    criteria: z.tuple([
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
    ]),
  })
  .superRefine((cat, ctx) => refineCategoryCriteria(cat.criteria, 3, ctx, []));

const category4StrictSchema = z
  .object({
    id: z.literal("ecclesial_and_spiritual"),
    name: z.string(),
    number: z.literal(4),
    criteria: z.tuple([
      evaluationCriterionStrictSchema,
      evaluationCriterionStrictSchema,
    ]),
  })
  .superRefine((cat, ctx) => refineCategoryCriteria(cat.criteria, 4, ctx, []));

export const evaluationCategoriesStrictSchema = z.tuple([
  category1StrictSchema,
  category2StrictSchema,
  category3StrictSchema,
  category4StrictSchema,
]);

export const heatmapRegisterStrictSchema = z.enum([
  "humor",
  "diagnostic",
  "declarative",
  "reverent",
  "pastoral",
  "awe",
  "encouragement",
  "convicting",
  "doxological",
  "teaching",
  "climactic",
  "invitation",
  "tender",
  "info",
]);

export const textSupportsStrictSchema = z.enum([
  "strong",
  "ok",
  "partial",
  "mismatch",
]);

export const heatmapBeatStrictSchema = z.object({
  time_range: z.string(),
  beat_label: z.string(),
  register: heatmapRegisterStrictSchema,
  text_supports: textSupportsStrictSchema,
  notes: z.string(),
});

export const evaluationHeatMapStrictSchema = z.object({
  total_minutes: z.number().int().positive().optional(),
  beats: z.array(heatmapBeatStrictSchema),
});

export const whatsWorkingCardStrictSchema = z.object({
  headline: z.string(),
  anchored_quote: z.string().nullable(),
  explanation: z.string(),
});

export const topPriorityStrictSchema = z.object({
  rank: z.number().int().min(1).max(3),
  headline: z.string(),
  principle_tag: z.string(),
  rationale: z.string(),
  practical_step: z.string(),
});

export const evaluationRewriteStrictSchema = z.object({
  moment_label: z.string(),
  analysis: z.string(),
  original: z.string(),
  rewrite: z.string(),
});

function makeEvaluationResultStrictObjectSchema(
  verdictSchema:
    | typeof evaluationVerdictPersistSchema
    | typeof evaluationVerdictReadGrandfatherSchema,
) {
  return z.object({
    meta: evaluationMetaStrictSchema,
    scoring: evaluationScoringStrictSchema,
    verdict: verdictSchema,
    categories: evaluationCategoriesStrictSchema,
    heat_map: evaluationHeatMapStrictSchema.nullable(),
    whats_working: z.array(whatsWorkingCardStrictSchema).min(3).max(5),
    top_priorities: z.array(topPriorityStrictSchema).length(3),
    rewrites: z.array(evaluationRewriteStrictSchema).min(1).max(2),
  });
}

const evaluationResultStrictPersistObjectSchema =
  makeEvaluationResultStrictObjectSchema(evaluationVerdictPersistSchema);

const evaluationResultStrictReadObjectSchema =
  makeEvaluationResultStrictObjectSchema(evaluationVerdictReadGrandfatherSchema);

export type EvaluationResultStrict = z.infer<
  typeof evaluationResultStrictPersistObjectSchema
>;

function refineEvaluationResultStructure(
  result: EvaluationResultStrict,
  ctx: z.RefinementCtx,
): void {
  if (!result.meta.audio_available && result.heat_map !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "heat_map must be null when meta.audio_available is false",
      path: ["heat_map"],
    });
  }
  if (result.meta.audio_available && result.heat_map === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "heat_map is required when meta.audio_available is true",
      path: ["heat_map"],
    });
  }

  const ranks = result.top_priorities.map((p) => p.rank);
  if (new Set(ranks).size !== 3 || !ranks.includes(1) || !ranks.includes(2) || !ranks.includes(3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "top_priorities must include ranks 1, 2, and 3 exactly once",
      path: ["top_priorities"],
    });
  }
}

function refineScoringMatchesCategories(
  result: EvaluationResultStrict,
  ctx: z.RefinementCtx,
): void {
  const sum = sumCriterionScores(result.categories);
  if (result.scoring.raw_total !== sum) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `raw_total must equal sum of criterion scores (${sum})`,
      path: ["scoring", "raw_total"],
    });
  }
  if (result.scoring.composite_simple !== sum) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `composite_simple must equal sum of criterion scores (${sum})`,
      path: ["scoring", "composite_simple"],
    });
  }

  const computed = computeScoringFromCategories(result.categories);
  if (result.scoring.composite_weighted !== computed.composite_weighted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `composite_weighted must equal round(weighted_raw × 55 / 70) (${computed.composite_weighted})`,
      path: ["scoring", "composite_weighted"],
    });
  }
  if (result.scoring.band !== computed.band) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `band must be derived from composite_weighted (${computed.band})`,
      path: ["scoring", "band"],
    });
  }
}

/** Tool output before server-side scoring recompute (shape + structure only). */
export const evaluationResultStrictBaseSchema =
  evaluationResultStrictPersistObjectSchema.superRefine(
    refineEvaluationResultStructure,
  );

/** Write path + read for prompt_version >= v2.3. */
export const evaluationResultStrictSchema = evaluationResultStrictBaseSchema.superRefine(
  refineScoringMatchesCategories,
);

/** Dashboard read for prompt_version < v2.3 (e.g. v2, v2.1, v2.2, fixture-*). */
export const evaluationResultStrictReadSchema =
  evaluationResultStrictReadObjectSchema
    .superRefine(refineEvaluationResultStructure)
    .superRefine(refineScoringMatchesCategories);
export type EvaluationScoringStrict = z.infer<typeof evaluationScoringStrictSchema>;
export type ScoreBand = z.infer<typeof scoreBandSchema>;
export type ScoreLetter = z.infer<typeof scoreLetterSchema>;

/** Tier label from weighted /55 score (display only; same thresholds as letter grades). */
export type ScoreTier = 1 | 2 | 3 | 4 | 5;

/** Letter grade from weighted /55 score (methodology appendix only). */
export function deriveLetterFromWeighted(weighted: number): ScoreLetter {
  if (weighted >= 47) return "A";
  if (weighted >= 39) return "B";
  if (weighted >= 30) return "C";
  if (weighted >= 22) return "D";
  return "F";
}

/** Band tier from weighted /55 score — 5 is best, aligned with criterion sliders. */
export function deriveTierFromWeighted(weighted: number): ScoreTier {
  if (weighted >= 47) return 5;
  if (weighted >= 39) return 4;
  if (weighted >= 30) return 3;
  if (weighted >= 22) return 2;
  return 1;
}

export function formatScoreBandStrict(scoring: EvaluationScoringStrict): string {
  return `${scoring.band} · Tier ${deriveTierFromWeighted(scoring.composite_weighted)}`;
}

/** Display stored score_band rows, including legacy "C · Faithful" strings. */
export function formatStoredScoreBand(
  scoreBand: string | null,
  overallScore: number | null,
): string {
  if (!scoreBand) return "View";
  if (scoreBand.includes("Tier ")) return scoreBand;

  const parts = scoreBand.split("·").map((part) => part.trim());
  if (parts.length === 2 && overallScore != null) {
    const [, band] = parts;
    return `${band} · Tier ${deriveTierFromWeighted(overallScore)}`;
  }

  return scoreBand;
}

export function diagnosticGap(
  compositeSimple: number,
  compositeWeighted: number,
): number {
  return compositeWeighted - compositeSimple;
}

/** Category subtotal caps: 15 / 15 / 15 / 10 */
export const CATEGORY_MAX_POINTS: Record<number, number> = {
  1: 15,
  2: 15,
  3: 15,
  4: 10,
};

export function categorySubtotal(
  criteria: { score: number }[],
): number {
  return criteria.reduce((sum, c) => sum + c.score, 0);
}

export function sumCriterionScores(
  categories: EvaluationResultStrict["categories"],
): number {
  return categories.reduce(
    (sum, category) => sum + categorySubtotal(category.criteria),
    0,
  );
}

/** Band label from weighted /55 composite (SCHEMA_SPEC grading bands). */
export function deriveBandFromWeighted(weighted: number): ScoreBand {
  if (weighted >= 47) return "Exemplary";
  if (weighted >= 39) return "Strong";
  if (weighted >= 30) return "Faithful";
  if (weighted >= 22) return "Needs Improvement";
  return "Significant Concerns";
}

/** Canonical scoring from criterion scores — sole source of truth for totals. */
export function computeScoringFromCategories(
  categories: EvaluationResultStrict["categories"],
): EvaluationScoringStrict {
  const scoresById: Record<number, number> = {};
  for (const category of categories) {
    for (const criterion of category.criteria) {
      scoresById[criterion.id] = criterion.score;
    }
  }

  const raw_total = sumCriterionScores(categories);
  const weightedRaw = raw_total + doubleWeightedBonus(scoresById);
  const composite_weighted = compositeWeightedFromWeightedRaw(weightedRaw);

  return {
    composite_simple: raw_total,
    composite_weighted,
    band: deriveBandFromWeighted(composite_weighted),
    raw_total,
    raw_max: SCORING_RAW_MAX,
  };
}

/** Overwrite model-submitted scoring with values derived from criteria. */
export function applyComputedScoring(
  result: EvaluationResultStrict,
): EvaluationResultStrict {
  return {
    ...result,
    scoring: computeScoringFromCategories(result.categories),
  };
}

export function categoryAverage(criteria: { score: number }[]): number {
  if (criteria.length === 0) return 0;
  return (
    Math.round((categorySubtotal(criteria) / criteria.length) * 10) / 10
  );
}

export function parseEvaluationResultStrict(
  value: unknown,
): EvaluationResultStrict | null {
  const parsed = evaluationResultStrictSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// Legacy DB read path (pre–v2 rows) — Step 7 cleanup deferred
// ---------------------------------------------------------------------------

export const submissionModeSchema = z.enum([
  "manuscript",
  "transcript",
  "manuscript-inferred",
]);

export const evaluationMetaSchema = z.object({
  sermon_title: z.string(),
  scripture_reference: z.string(),
  preacher_name: z.string().nullable(),
  church_or_context: z.string().nullable(),
  estimated_length_minutes: z.number().int().positive(),
  series_name: z.string().nullable(),
  submission_mode: submissionModeSchema,
});

export const evaluationScoringSchema = z.object({
  composite_simple: z.number().int().min(0).max(100),
  composite_weighted: z.number().int().min(0).max(100),
  band: scoreBandSchema,
  letter: scoreLetterSchema,
  diagnostic_gap: z.number().int(),
  raw_total: z.number().int().min(0),
  raw_max: z.number().int().positive(),
});

export const evaluationVerdictSchema = z.object({
  affirmation_paragraph: z.string(),
  improvement_sentence: z.string(),
});

export const anchoredQuoteSchema = z.object({
  text: z.string(),
  approximate_location: z.string(),
});

export const evaluationCriterionSchema = z.object({
  name: z.string(),
  source: z.string(),
  principle_tag: z.string(),
  score: z.number().int().min(1).max(5),
  weighted: z.boolean(),
  detail_paragraphs: z.array(z.string()).min(1).max(5),
  anchored_quote: anchoredQuoteSchema.nullable(),
});

export const categoryGrowthOpportunitySchema = z.object({
  headline: z.string(),
  explanation: z.string(),
});

export const evaluationCategorySchema = z.object({
  id: categoryIdSchema,
  name: z.string(),
  number: z.number().int().min(1).max(4),
  subtotal: z.number().int().min(0),
  max: z.number().int().positive(),
  average: z.number(),
  criteria: z.array(evaluationCriterionSchema).min(1),
  growth_opportunities: z.array(categoryGrowthOpportunitySchema),
});

export const heatmapRegisterSchema = z.enum([
  "diagnostic",
  "teaching",
  "reverent",
  "pastoral",
  "convicting",
  "climactic",
  "awe",
  "tender",
  "doxological",
  "declarative",
]);

export const textSupportsSchema = z.enum([
  "strong",
  "yes",
  "partial",
  "mismatch",
]);

export const heatmapBeatSchema = z.object({
  time_start_seconds: z.number().int().min(0),
  time_end_seconds: z.number().int().min(0),
  time_display: z.string(),
  label: z.string(),
  register: heatmapRegisterSchema,
  text_supports: textSupportsSchema,
  notes: z.string(),
});

export const evaluationHeatMapSchema = z.object({
  audio_processed: z.boolean(),
  warning_note: z.string().nullable(),
  total_minutes: z.number().int().positive(),
  beats: z.array(heatmapBeatSchema).min(1),
});

export const whatsWorkingCardSchema = z.object({
  headline: z.string(),
  anchored_quote: z.string().nullable(),
  explanation: z.string(),
});

export const growthOpportunityDetailedSchema = z.object({
  number: z.number().int().min(1).max(3),
  headline: z.string(),
  principle_badge: z.string(),
  diagnosis_paragraphs: z.array(z.string()).min(1).max(5),
  next_step: z.string(),
});

export const topPrioritySchema = z.object({
  rank: z.number().int().min(1).max(3),
  headline: z.string(),
  rationale: z.string(),
  practical_step: z.string(),
});

export const evaluationRewriteSchema = z.object({
  moment_label: z.string(),
  analysis: z.string(),
  original: z.string(),
  rewrite: z.string(),
});

export const evaluationFcfSchema = z.object({
  named_in_sermon: z.boolean(),
  implied_fcf: z.string(),
  placement_notes: z.string().nullable(),
});

export const methodologyNoteSchema = z.object({
  diagnostic_summary: z.string(),
});

/** Stored rows: legacy v2 shape + optional sections — Step 7 will align read path. */
export const evaluationResultSchema = z.object({
  meta: evaluationMetaSchema,
  scoring: evaluationScoringSchema,
  verdict: evaluationVerdictSchema,
  categories: z.array(evaluationCategorySchema).min(1),
  heat_map: evaluationHeatMapSchema.optional(),
  whats_working: z.array(whatsWorkingCardSchema).optional(),
  growth_opportunities_detailed: z
    .array(growthOpportunityDetailedSchema)
    .optional(),
  top_priorities: z.array(topPrioritySchema).optional(),
  rewrites: z.array(evaluationRewriteSchema).optional(),
  fcf: evaluationFcfSchema.optional(),
  methodology_note: methodologyNoteSchema.optional(),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationScoring = z.infer<typeof evaluationScoringSchema>;

/** Legacy rows that still include scoring.letter. */
export function formatScoreBand(scoring: EvaluationScoring): string {
  const tier =
    scoring.composite_weighted != null
      ? deriveTierFromWeighted(scoring.composite_weighted)
      : ({ A: 5, B: 4, C: 3, D: 2, F: 1 } as const)[scoring.letter];
  return `${scoring.band} · Tier ${tier}`;
}

function isLegacyShape(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "headline" in value &&
    !("scoring" in value)
  );
}

function parsePromptVersionSegments(version: string): number[] | null {
  const match = version.match(/^v(\d+(?:\.\d+)*)/);
  if (!match) return null;
  return match[1].split(".").map(Number);
}

export function promptVersionAtLeast(version: string, floor: string): boolean {
  const a = parsePromptVersionSegments(version);
  const b = parsePromptVersionSegments(floor);
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return true;
}

/** fixture-* and v2 / v2.1 / v2.2 rows skip 60/32 verdict caps on read. */
export function usesVerdictReadGrandfather(
  promptVersion: string | null | undefined,
): boolean {
  if (promptVersion == null || promptVersion === "") return true;
  if (promptVersion.startsWith("fixture-")) return true;
  return !promptVersionAtLeast(promptVersion, VERDICT_STRICT_CAPS_FROM);
}

export type ParseEvaluationResultOptions = {
  promptVersion?: string | null;
};

export function parseEvaluationResult(
  value: unknown,
  options: ParseEvaluationResultOptions = {},
): EvaluationResultStrict | null {
  const schema = usesVerdictReadGrandfather(options.promptVersion)
    ? evaluationResultStrictReadSchema
    : evaluationResultStrictSchema;
  const strict = schema.safeParse(value);
  if (strict.success) return strict.data;

  const v2 = evaluationResultSchema.safeParse(value);
  if (v2.success) return null;

  if (isLegacyShape(value)) {
    return null;
  }
  return null;
}
