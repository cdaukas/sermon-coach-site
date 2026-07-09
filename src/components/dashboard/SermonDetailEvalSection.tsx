"use client";

import { useMemo, useState } from "react";
import { SermonDetailEvaluationActions } from "@/components/dashboard/SermonDetailEvaluationActions";
import { SermonEvaluationCards } from "@/components/dashboard/SermonEvaluationCards";
import type { StashedReportMode } from "@/lib/evaluation/context";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { getDefaultEvaluationCardTab } from "@/lib/evaluation/group-sermon-evaluations";
import type { SermonEvaluationListItem } from "@/lib/evaluation/types";

type SermonDetailEvalSectionProps = {
  sermonId: string;
  completeEvaluations: SermonEvaluationListItem[];
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
};

export function SermonDetailEvalSection({
  sermonId,
  completeEvaluations,
  entitlement,
  hasActiveEvaluation,
}: SermonDetailEvalSectionProps) {
  const defaultMode = useMemo(
    () => getDefaultEvaluationCardTab(completeEvaluations),
    [completeEvaluations],
  );
  const [selectedMode, setSelectedMode] = useState<StashedReportMode>(defaultMode);

  return (
    <>
      <SermonEvaluationCards
        sermonId={sermonId}
        completeEvaluations={completeEvaluations}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
      />

      <SermonDetailEvaluationActions
        sermonId={sermonId}
        completeEvaluations={completeEvaluations}
        reportMode={selectedMode}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
      />
    </>
  );
}
