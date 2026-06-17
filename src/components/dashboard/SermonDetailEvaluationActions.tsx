"use client";

import { useState } from "react";
import { ReportTypeToggle } from "@/components/dashboard/ReportTypeToggle";
import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import type { StashedReportMode } from "@/lib/evaluation/context";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

type SermonDetailEvaluationActionsProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
};

export function SermonDetailEvaluationActions({
  sermonId,
  entitlement,
  hasActiveEvaluation,
}: SermonDetailEvaluationActionsProps) {
  const [reportMode, setReportMode] = useState<StashedReportMode>("diagnostic");

  return (
    <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <ReportTypeToggle
        value={reportMode}
        onChange={setReportMode}
        disabled={hasActiveEvaluation}
      />
      <div className="w-full lg:w-auto lg:min-w-[200px]">
        <EvaluateButton
          sermonId={sermonId}
          entitlement={entitlement}
          hasActiveEvaluation={hasActiveEvaluation}
          reportMode={reportMode}
          embedded
        />
      </div>
    </div>
  );
}
