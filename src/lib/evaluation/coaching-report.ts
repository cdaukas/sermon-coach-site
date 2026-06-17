import type { CoachingNarrative } from "./coaching-schema";
import type { CoachingReportPresentation } from "./coaching-report-types";
import type { EvaluationWithSermon } from "./types";

function toNarrativePresentation(
  narrative: CoachingNarrative | null,
): CoachingReportPresentation["coachingNarrative"] {
  if (!narrative) {
    return null;
  }

  return {
    lead_with_this: narrative.lead_with_this.map((strength) => {
      const row = strength as CoachingNarrative["lead_with_this"][number] & {
        why?: string;
      };

      return {
        claim: row.claim,
        quote: row.quote,
        development: row.development,
        why: row.why,
      };
    }),
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

  return {
    sermonTitle: sermon.title,
    scriptureReference,
    evaluatedAt,
    preacherName: result.meta.preacher_name,
    submissionMode: result.meta.submission_mode,
    overallBand: result.scoring.band,
    coachingNarrative: toNarrativePresentation(evaluation.coaching_narrative),
  };
}
