import { z } from "zod";
import { normalizeLegacyEvaluationResult } from "./schema-legacy";

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

export const scoreBandSchema = z.enum([
  "Exemplary",
  "Strong",
  "Faithful",
  "Needs Improvement",
  "Significant Concerns",
]);

export const scoreLetterSchema = z.enum(["A", "B", "C", "D", "F"]);

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

export const categoryIdSchema = z.enum([
  "text_and_theology",
  "structure_and_craft",
  "application_and_audience",
  "ecclesial_and_spiritual",
]);

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

/** Stored rows: v2 required core; extended sections optional for partial saves. */
export const evaluationResultSchema = z.object({
  meta: evaluationMetaSchema,
  scoring: evaluationScoringSchema,
  verdict: evaluationVerdictSchema,
  categories: z.array(evaluationCategorySchema).min(1),
  heat_map: evaluationHeatMapSchema.optional(),
  whats_working: z.array(whatsWorkingCardSchema).optional(),
  growth_opportunities_detailed: z.array(growthOpportunityDetailedSchema).optional(),
  top_priorities: z.array(topPrioritySchema).optional(),
  rewrites: z.array(evaluationRewriteSchema).optional(),
  fcf: evaluationFcfSchema.optional(),
  methodology_note: methodologyNoteSchema.optional(),
});

/** Claude tool output — all sections required. */
export const evaluationResultStrictSchema = z.object({
  meta: evaluationMetaSchema,
  scoring: evaluationScoringSchema,
  verdict: evaluationVerdictSchema,
  categories: z.array(evaluationCategorySchema).length(4),
  heat_map: evaluationHeatMapSchema,
  whats_working: z.array(whatsWorkingCardSchema).min(3).max(5),
  growth_opportunities_detailed: z.array(growthOpportunityDetailedSchema).length(3),
  top_priorities: z.array(topPrioritySchema).length(3),
  rewrites: z.array(evaluationRewriteSchema).min(1).max(2),
  fcf: evaluationFcfSchema,
  methodology_note: methodologyNoteSchema,
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationResultStrict = z.infer<typeof evaluationResultStrictSchema>;

export function formatScoreBand(scoring: EvaluationScoring): string {
  return `${scoring.letter} · ${scoring.band}`;
}

export type EvaluationScoring = z.infer<typeof evaluationScoringSchema>;

function isLegacyShape(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "headline" in value &&
    !("scoring" in value)
  );
}

export function parseEvaluationResult(
  value: unknown,
): EvaluationResult | null {
  const v2 = evaluationResultSchema.safeParse(value);
  if (v2.success) return v2.data;
  if (isLegacyShape(value)) {
    return normalizeLegacyEvaluationResult(value);
  }
  return null;
}

export function parseEvaluationResultStrict(
  value: unknown,
): EvaluationResultStrict | null {
  const parsed = evaluationResultStrictSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
