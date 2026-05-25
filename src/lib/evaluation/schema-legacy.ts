import { z } from "zod";
import type { EvaluationResult } from "./schema";
import {
  heatmapRegisterSchema,
  scoreBandSchema,
  scoreLetterSchema,
  textSupportsSchema,
} from "./schema";

/** v1 shape (camelCase) — used only to normalize older rows in the database. */
const legacyMetaSchema = z.object({
  title: z.string(),
  passage: z.string(),
  preacher: z.string(),
  length: z.string(),
  mode: z.string(),
  source: z.string(),
});

const legacyHeadlineSchema = z.object({
  score: z.number().int(),
  band: z.string(),
  strengthVerdict: z.string(),
  improvementVerdict: z.string(),
});

const legacyCriterionSchema = z.object({
  name: z.string(),
  principle: z.string(),
  score: z.number().int().min(1).max(5),
  detail: z.string(),
  blockquotes: z.array(z.string()).optional(),
});

const legacyCategorySchema = z.object({
  number: z.number().int(),
  title: z.string(),
  averageLabel: z.string(),
  criteria: z.array(legacyCriterionSchema),
  growthItems: z.array(z.string()).optional(),
});

const legacyHeatmapSchema = z.object({
  disclaimer: z.string(),
  timeline: z.array(
    z.object({
      label: z.string(),
      register: z.string(),
      flex: z.number().optional(),
    }),
  ),
  rows: z.array(
    z.object({
      time: z.string(),
      beat: z.string(),
      register: z.string(),
      textSupport: z.string(),
      notes: z.string(),
    }),
  ),
});

const legacyResultSchema = z.object({
  meta: legacyMetaSchema,
  headline: legacyHeadlineSchema,
  categories: z.array(legacyCategorySchema).min(1),
  heatmap: legacyHeatmapSchema.optional(),
  working: z
    .array(
      z.object({
        headline: z.string(),
        blockquote: z.string().optional(),
        detail: z.string(),
      }),
    )
    .optional(),
  growthOpportunities: z
    .array(
      z.object({
        number: z.string(),
        headline: z.string(),
        principleBadge: z.string(),
        detail: z.string(),
        nextStep: z.string(),
      }),
    )
    .optional(),
  priorities: z
    .array(
      z.object({
        number: z.string(),
        headline: z.string(),
        rationale: z.string(),
        practicalStep: z.string(),
      }),
    )
    .optional(),
  rewrites: z
    .array(
      z.object({
        label: z.string(),
        headline: z.string(),
        analysis: z.string(),
        weak: z.string(),
        strong: z.string(),
      }),
    )
    .optional(),
  methodology: z
    .object({
      simpleScore: z.number().int(),
      weightedScore: z.number().int(),
      explainer: z.string().optional(),
    })
    .optional(),
});

function parseBandParts(band: string): {
  letter: z.infer<typeof scoreLetterSchema>;
  label: z.infer<typeof scoreBandSchema>;
} {
  const match = band.match(/^([A-F])\s*·\s*(.+)$/i);
  const letterRaw = match?.[1]?.toUpperCase() ?? "B";
  const labelRaw = match?.[2]?.trim() ?? band;
  const letterParsed = scoreLetterSchema.safeParse(letterRaw);
  const bandParsed = scoreBandSchema.safeParse(labelRaw);
  if (bandParsed.success && letterParsed.success) {
    return { letter: letterParsed.data, label: bandParsed.data };
  }
  for (const option of scoreBandSchema.options) {
    if (labelRaw.toLowerCase().includes(option.toLowerCase())) {
      const letter =
        option === "Exemplary"
          ? "A"
          : option === "Strong"
            ? "B"
            : option === "Faithful"
              ? "C"
              : option === "Needs Improvement"
                ? "D"
                : "F";
      return {
        letter: scoreLetterSchema.parse(letter),
        label: option,
      };
    }
  }
  return { letter: "B", label: "Strong" };
}

function mapTextSupport(text: string): z.infer<typeof textSupportsSchema> {
  const lower = text.toLowerCase();
  if (lower.includes("partial") || lower.includes("⚠")) return "partial";
  if (lower.includes("mismatch")) return "mismatch";
  if (lower.includes("strong")) return "strong";
  return "yes";
}

function mapRegister(register: string): z.infer<typeof heatmapRegisterSchema> {
  const lower = register.toLowerCase();
  for (const r of heatmapRegisterSchema.options) {
    if (lower.includes(r)) return r;
  }
  return "teaching";
}

export function normalizeLegacyEvaluationResult(value: unknown): EvaluationResult | null {
  const parsed = legacyResultSchema.safeParse(value);
  if (!parsed.success) return null;

  const legacy = parsed.data;
  const { letter, label } = parseBandParts(legacy.headline.band);
  const weighted = legacy.headline.score;
  const simple = legacy.methodology?.simpleScore ?? weighted;

  const categories: EvaluationResult["categories"] = legacy.categories.map((cat, index) => {
    const subtotal = cat.criteria.reduce((sum, c) => sum + c.score, 0);
    const max = cat.criteria.length * 5;
    const average = Math.round((subtotal / cat.criteria.length) * 10) / 10;
    const ids = [
      "text_and_theology",
      "structure_and_craft",
      "application_and_audience",
      "ecclesial_and_spiritual",
    ] as const;

    return {
      id: ids[index] ?? "text_and_theology",
      name: cat.title,
      number: cat.number,
      subtotal,
      max,
      average,
      criteria: cat.criteria.map((c) => ({
        name: c.name,
        source: c.principle.split("·")[0]?.trim() ?? c.principle,
        principle_tag: c.principle,
        score: c.score,
        weighted: /fcf|gospel|application/i.test(c.principle),
        detail_paragraphs: [c.detail],
        anchored_quote: c.blockquotes?.[0]
          ? { text: c.blockquotes[0], approximate_location: "manuscript" }
          : null,
      })),
      growth_opportunities: (cat.growthItems ?? []).map((item) => ({
        headline: item,
        explanation: item,
      })),
    };
  });

  const heat_map: EvaluationResult["heat_map"] = legacy.heatmap
    ? {
        audio_processed: false,
        warning_note: legacy.heatmap.disclaimer,
        total_minutes: 40,
        beats: legacy.heatmap.rows.map((row, i) => ({
          time_start_seconds: i * 120,
          time_end_seconds: (i + 1) * 120,
          time_display: row.time,
          label: row.beat,
          register: mapRegister(row.register),
          text_supports: mapTextSupport(row.textSupport),
          notes: row.notes,
        })),
      }
    : {
        audio_processed: false,
        warning_note: "Inferred from manuscript — audio not processed",
        total_minutes: 40,
        beats: [],
      };

  return {
    meta: {
      sermon_title: legacy.meta.title,
      scripture_reference: legacy.meta.passage,
      preacher_name: legacy.meta.preacher,
      church_or_context: null,
      estimated_length_minutes: 40,
      series_name: null,
      submission_mode: "manuscript",
    },
    scoring: {
      composite_simple: simple,
      composite_weighted: weighted,
      band: label,
      letter,
      diagnostic_gap: weighted - simple,
      raw_total: categories.reduce((sum, c) => sum + c.subtotal, 0),
      raw_max: 55,
    },
    verdict: {
      affirmation_paragraph: legacy.headline.strengthVerdict,
      improvement_sentence: legacy.headline.improvementVerdict,
    },
    categories,
    heat_map,
    whats_working: (legacy.working ?? []).map((w) => ({
      headline: w.headline,
      anchored_quote: w.blockquote ?? null,
      explanation: w.detail,
    })),
    growth_opportunities_detailed: (legacy.growthOpportunities ?? []).map((g, i) => ({
      number: Number.parseInt(g.number, 10) || i + 1,
      headline: g.headline,
      principle_badge: g.principleBadge,
      diagnosis_paragraphs: [g.detail],
      next_step: g.nextStep,
    })),
    top_priorities: (legacy.priorities ?? []).map((p, i) => ({
      rank: Number.parseInt(p.number, 10) || i + 1,
      headline: p.headline,
      rationale: p.rationale,
      practical_step: p.practicalStep,
    })),
    rewrites: (legacy.rewrites ?? []).map((r) => ({
      moment_label: r.headline,
      analysis: r.analysis,
      original: r.weak,
      rewrite: r.strong,
    })),
    fcf: {
      named_in_sermon: false,
      implied_fcf: "See category feedback for fallen-condition focus.",
      placement_notes: null,
    },
    methodology_note: {
      diagnostic_summary:
        legacy.methodology?.explainer ??
        `Weighted score ${weighted} vs simple ${simple}.`,
    },
  };
}
