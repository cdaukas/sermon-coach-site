"use client";

import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import { EvaluationCreditLine } from "@/components/evaluation/EvaluationCreditLine";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

type ReportEvaluationRerunProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  isMentoredMentee?: boolean;
};

/**
 * Diagnostic re-run on the completed evaluation report.
 * reportMode is always "diagnostic" — never inherits from tabs or the viewed report.
 * Mentored mentees still hit create_mentored_evaluation; requestEvaluation ignores
 * reportMode on that path and pairs diagnostic + debrief via RPC.
 */
export function ReportEvaluationRerun({
  sermonId,
  entitlement,
  hasActiveEvaluation,
  isMentoredMentee = false,
}: ReportEvaluationRerunProps) {
  return (
    <div className="screen-only mt-12">
      <EvaluateButton
        sermonId={sermonId}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
        reportMode="diagnostic"
        embedded
        hideCreditLine
        buttonLabel="Run The Evaluation again"
        isMentoredMentee={isMentoredMentee}
      />
      {!isMentoredMentee ? (
        <EvaluationCreditLine entitlement={entitlement} />
      ) : null}
    </div>
  );
}
