"use client";

import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import { EvaluationCreditLine } from "@/components/evaluation/EvaluationCreditLine";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import {
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";

type ReportEvaluationRerunProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  isMentoredMentee?: boolean;
  outputLanguage?: OutputLanguage;
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
  outputLanguage = "en",
}: ReportEvaluationRerunProps) {
  const copy = evaluationReportCopy(outputLanguage);
  return (
    <div className="screen-only mt-12">
      <EvaluateButton
        sermonId={sermonId}
        entitlement={entitlement}
        hasActiveEvaluation={hasActiveEvaluation}
        reportMode="diagnostic"
        embedded
        hideCreditLine
        buttonLabel={copy.runEvaluationAgain}
        isMentoredMentee={isMentoredMentee}
        outputLanguage={outputLanguage}
      />
      {!isMentoredMentee ? (
        <EvaluationCreditLine
          entitlement={entitlement}
          outputLanguage={outputLanguage}
        />
      ) : null}
    </div>
  );
}
