import { z } from "zod";

export const evaluationMetaSchema = z.object({
  title: z.string(),
  passage: z.string(),
  preacher: z.string(),
  length: z.string(),
  mode: z.string(),
  source: z.string(),
});

export const evaluationHeadlineSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: z.string(),
  strengthVerdict: z.string(),
  improvementVerdict: z.string(),
});

export const evaluationCriterionSchema = z.object({
  name: z.string(),
  principle: z.string(),
  score: z.number().int().min(1).max(5),
  detail: z.string(),
  blockquotes: z.array(z.string()).optional(),
});

export const evaluationCategorySchema = z.object({
  number: z.number().int().min(1),
  title: z.string(),
  averageLabel: z.string(),
  criteria: z.array(evaluationCriterionSchema).min(1),
  growthItems: z.array(z.string()).optional(),
});

export const evaluationHeatmapBeatSchema = z.object({
  label: z.string(),
  register: z.string(),
  flex: z.number().positive().optional(),
});

export const evaluationHeatmapRowSchema = z.object({
  time: z.string(),
  beat: z.string(),
  register: z.string(),
  textSupport: z.string(),
  notes: z.string(),
});

export const evaluationHeatmapSchema = z.object({
  disclaimer: z.string(),
  timeline: z.array(evaluationHeatmapBeatSchema).min(1),
  rows: z.array(evaluationHeatmapRowSchema).min(1),
});

export const evaluationWorkingCardSchema = z.object({
  headline: z.string(),
  blockquote: z.string().optional(),
  detail: z.string(),
});

export const evaluationGrowthOpportunitySchema = z.object({
  number: z.string(),
  headline: z.string(),
  principleBadge: z.string(),
  detail: z.string(),
  nextStep: z.string(),
});

export const evaluationPrioritySchema = z.object({
  number: z.string(),
  headline: z.string(),
  rationale: z.string(),
  practicalStep: z.string(),
});

export const evaluationRewriteSchema = z.object({
  label: z.string(),
  headline: z.string(),
  analysis: z.string(),
  weak: z.string(),
  strong: z.string(),
});

export const evaluationMethodologyBandSchema = z.object({
  letter: z.string(),
  range: z.string(),
  band: z.string(),
  meaning: z.string(),
  isCurrent: z.boolean().optional(),
});

export const evaluationMethodologySchema = z.object({
  summary: z.string(),
  bands: z.array(evaluationMethodologyBandSchema).min(1),
  simpleScore: z.number().int().min(0).max(100),
  weightedScore: z.number().int().min(0).max(100),
  explainer: z.string(),
  subtotals: z.array(
    z.object({
      category: z.string(),
      score: z.string(),
    }),
  ),
  mathNotes: z.string(),
});

/** Stored rows: core sections required; extended sections optional (fixture / older rows). */
export const evaluationResultSchema = z.object({
  meta: evaluationMetaSchema,
  headline: evaluationHeadlineSchema,
  categories: z.array(evaluationCategorySchema).min(1),
  heatmap: evaluationHeatmapSchema.optional(),
  working: z.array(evaluationWorkingCardSchema).optional(),
  growthOpportunities: z.array(evaluationGrowthOpportunitySchema).optional(),
  priorities: z.array(evaluationPrioritySchema).optional(),
  rewrites: z.array(evaluationRewriteSchema).optional(),
  methodology: evaluationMethodologySchema.optional(),
});

/** Claude tool output — all sections required. */
export const evaluationResultStrictSchema = z.object({
  meta: evaluationMetaSchema,
  headline: evaluationHeadlineSchema,
  categories: z.array(evaluationCategorySchema).min(3).max(4),
  heatmap: evaluationHeatmapSchema,
  working: z.array(evaluationWorkingCardSchema).min(4).max(4),
  growthOpportunities: z.array(evaluationGrowthOpportunitySchema).min(3).max(3),
  priorities: z.array(evaluationPrioritySchema).min(3).max(3),
  rewrites: z.array(evaluationRewriteSchema).min(1).max(2),
  methodology: evaluationMethodologySchema,
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationResultStrict = z.infer<typeof evaluationResultStrictSchema>;

export function parseEvaluationResult(
  value: unknown,
): EvaluationResult | null {
  const parsed = evaluationResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseEvaluationResultStrict(
  value: unknown,
): EvaluationResultStrict | null {
  const parsed = evaluationResultStrictSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
