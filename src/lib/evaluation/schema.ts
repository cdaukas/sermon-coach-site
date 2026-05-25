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

/** v1 subset — extended sections optional until 6.5 */
export const evaluationResultSchema = z.object({
  meta: evaluationMetaSchema,
  headline: evaluationHeadlineSchema,
  categories: z.array(evaluationCategorySchema).min(1),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export function parseEvaluationResult(
  value: unknown,
): EvaluationResult | null {
  const parsed = evaluationResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
