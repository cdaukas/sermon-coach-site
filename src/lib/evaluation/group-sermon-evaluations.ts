import type { StashedReportMode } from "./context";
import type { ReportMode, SermonEvaluationListItem } from "./types";

export type ModeEvaluationGroup = {
  latest: SermonEvaluationListItem | null;
  older: SermonEvaluationListItem[];
};

export type EvaluationsByMode = Record<ReportMode, ModeEvaluationGroup>;

function evaluationTimestamp(evaluation: SermonEvaluationListItem): number {
  return new Date(evaluation.completed_at ?? evaluation.created_at).getTime();
}

export function groupCompleteEvaluationsByMode(
  completeEvaluations: SermonEvaluationListItem[],
): EvaluationsByMode {
  const diagnostic = completeEvaluations.filter(
    (evaluation) => evaluation.report_mode === "diagnostic",
  );
  const coaching = completeEvaluations.filter(
    (evaluation) => evaluation.report_mode === "coaching",
  );

  return {
    diagnostic: {
      latest: diagnostic[0] ?? null,
      older: diagnostic.slice(1),
    },
    coaching: {
      latest: coaching[0] ?? null,
      older: coaching.slice(1),
    },
  };
}

export function getDefaultEvaluationCardTab(
  completeEvaluations: SermonEvaluationListItem[],
): StashedReportMode {
  if (completeEvaluations.length === 0) {
    return "diagnostic";
  }

  return completeEvaluations[0].report_mode;
}

export function getSmartDefaultRunMode(
  grouped: EvaluationsByMode,
): StashedReportMode {
  const hasDiagnostic = grouped.diagnostic.latest !== null;
  const hasCoaching = grouped.coaching.latest !== null;

  if (!hasDiagnostic && !hasCoaching) {
    return "diagnostic";
  }

  if (hasDiagnostic && !hasCoaching) {
    return "coaching";
  }

  if (!hasDiagnostic && hasCoaching) {
    return "diagnostic";
  }

  const diagnosticTime = evaluationTimestamp(grouped.diagnostic.latest!);
  const coachingTime = evaluationTimestamp(grouped.coaching.latest!);

  return diagnosticTime <= coachingTime ? "diagnostic" : "coaching";
}

export function modeDisplayName(mode: StashedReportMode): string {
  return mode === "coaching" ? "Mentoring" : "Personal";
}
