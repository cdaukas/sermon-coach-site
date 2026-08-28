"use client";

import { useMemo, useState } from "react";
import { MenteeHandoffCopy } from "@/components/dashboard/MenteeHandoffCopy";
import { SermonDetailEvaluationActions } from "@/components/dashboard/SermonDetailEvaluationActions";
import { SermonEvaluationCards } from "@/components/dashboard/SermonEvaluationCards";
import type { ReportMode } from "@/lib/evaluation/context";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { getDefaultEvaluationCardTab } from "@/lib/evaluation/group-sermon-evaluations";
import type { SermonEvaluationListItem } from "@/lib/evaluation/types";

type SermonDetailEvalSectionProps = {
  sermonId: string;
  completeEvaluations: SermonEvaluationListItem[];
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  isMentoredMentee?: boolean;
  mentoringDebriefAllowed?: boolean;
  menteeReadsNone?: boolean;
  handoffMentorName?: string;
};

export function SermonDetailEvalSection({
  sermonId,
  completeEvaluations,
  entitlement,
  hasActiveEvaluation,
  isMentoredMentee = false,
  mentoringDebriefAllowed = false,
  menteeReadsNone = false,
  handoffMentorName,
}: SermonDetailEvalSectionProps) {
  const defaultMode = useMemo(
    () => getDefaultEvaluationCardTab(completeEvaluations),
    [completeEvaluations],
  );
  const [selectedMode, setSelectedMode] = useState<ReportMode>(defaultMode);

  if (menteeReadsNone) {
    if (completeEvaluations.length === 0) {
      return (
        <MenteeHandoffCopy mentorName={handoffMentorName ?? "your mentor"} />
      );
    }

    return (
      <SermonEvaluationCards
        sermonId={sermonId}
        completeEvaluations={completeEvaluations}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        isMentoredMentee={isMentoredMentee}
        mentoringDebriefAllowed={mentoringDebriefAllowed}
      />
    );
  }

  return (
    <>
      <SermonEvaluationCards
        sermonId={sermonId}
        completeEvaluations={completeEvaluations}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        isMentoredMentee={isMentoredMentee}
        mentoringDebriefAllowed={mentoringDebriefAllowed}
      />

      <SermonDetailEvaluationActions
        sermonId={sermonId}
        completeEvaluations={completeEvaluations}
        reportMode={selectedMode}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
        isMentoredMentee={isMentoredMentee}
        mentoringDebriefAllowed={mentoringDebriefAllowed}
      />
    </>
  );
}
