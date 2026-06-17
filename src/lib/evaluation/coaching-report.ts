import type { CoachingNarrative } from "./coaching-schema";
import type { CoachingReportPresentation } from "./coaching-report-types";
import {
  CATEGORY_MAX_POINTS,
  categoryAverage,
  categorySubtotal,
  deriveBandFromWeighted,
} from "./schema";
import type { EvaluationWithSermon } from "./types";

function deriveBandFromCategorySubtotal(subtotal: number, max: number): string {
  const equivalentWeighted = Math.round((subtotal / max) * 55);
  return deriveBandFromWeighted(equivalentWeighted);
}

function toNarrativePresentation(
  narrative: CoachingNarrative | null,
): CoachingReportPresentation["coachingNarrative"] {
  if (!narrative) {
    return null;
  }

  return {
    lead_with_this: narrative.lead_with_this.map((strength) => ({
      claim: strength.claim,
      quote: strength.quote,
      why: strength.why,
    })),
    how_to_grow: {
      edge: narrative.how_to_grow.edge,
      this_week: narrative.how_to_grow.this_week,
    },
    what_it_looks_like: {
      before: narrative.what_it_looks_like.before,
      after: narrative.what_it_looks_like.after,
      what_changed: narrative.what_it_looks_like.what_changed,
    },
  };
}

/** Strips server-only evaluation payloads for presentational components. */
export function toCoachingReportPresentation(
  data: EvaluationWithSermon,
): CoachingReportPresentation {
  const { evaluation, sermon } = data;
  const result = evaluation.result!;
  const evaluatedAt = evaluation.completed_at ?? evaluation.created_at;
  const scriptureReference =
    sermon.primary_passage?.trim() ||
    result.meta.scripture_reference.trim() ||
    "";

  const categories = result.categories.map((category) => {
    const subtotal = categorySubtotal(category.criteria);
    const max = CATEGORY_MAX_POINTS[category.number] ?? subtotal;
    const average = categoryAverage(category.criteria);

    return {
      id: category.id,
      number: category.number,
      name: category.name,
      band: deriveBandFromCategorySubtotal(subtotal, max),
      scoreLabel: `${subtotal}/${max}`,
      averageLabel: `${average} / 5`,
    };
  });

  return {
    sermonTitle: sermon.title,
    scriptureReference,
    evaluatedAt,
    preacherName: result.meta.preacher_name,
    submissionMode: result.meta.submission_mode,
    categories,
    coachingNarrative: toNarrativePresentation(evaluation.coaching_narrative),
  };
}
