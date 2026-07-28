import type { ReportMode } from "./types";
import type { SermonEvaluationListItem } from "./types";

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
  const debrief = completeEvaluations.filter(
    (evaluation) => evaluation.report_mode === "debrief",
  );

  return {
    diagnostic: {
      latest: diagnostic[0] ?? null,
      older: diagnostic.slice(1),
    },
    debrief: {
      latest: debrief[0] ?? null,
      older: debrief.slice(1),
    },
  };
}

export function getDefaultEvaluationCardTab(
  completeEvaluations: SermonEvaluationListItem[],
): ReportMode {
  if (completeEvaluations.length === 0) {
    return "diagnostic";
  }

  return completeEvaluations[0].report_mode;
}

export function getSmartDefaultRunMode(
  grouped: EvaluationsByMode,
): ReportMode {
  const hasDiagnostic = grouped.diagnostic.latest !== null;
  const hasDebrief = grouped.debrief.latest !== null;

  if (!hasDiagnostic && !hasDebrief) {
    return "diagnostic";
  }

  if (hasDiagnostic && !hasDebrief) {
    return "debrief";
  }

  if (!hasDiagnostic && hasDebrief) {
    return "diagnostic";
  }

  const diagnosticTime = evaluationTimestamp(grouped.diagnostic.latest!);
  const debriefTime = evaluationTimestamp(grouped.debrief.latest!);

  return diagnosticTime <= debriefTime ? "diagnostic" : "debrief";
}

export function modeDisplayName(mode: ReportMode): string {
  return mode === "debrief" ? "The Mentoring Debrief" : "The Evaluation";
}
