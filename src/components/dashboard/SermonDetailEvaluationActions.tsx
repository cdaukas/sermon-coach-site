"use client";

import { useMemo, useRef, useState } from "react";
import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import { EvaluationCreditLine } from "@/components/evaluation/EvaluationCreditLine";
import type { ReportMode } from "@/lib/evaluation/context";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import {
  groupCompleteEvaluationsByMode,
  modeDisplayName,
} from "@/lib/evaluation/group-sermon-evaluations";
import type { SermonEvaluationListItem } from "@/lib/evaluation/types";

const uiFont = { fontFamily: "var(--font-ui)" };

type SermonDetailEvaluationActionsProps = {
  sermonId: string;
  completeEvaluations: SermonEvaluationListItem[];
  reportMode: ReportMode;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  isMentoredMentee?: boolean;
  /** MENTORING_DEBRIEF_ALLOWLIST only — independent of the mentoring rail. */
  mentoringDebriefAllowed?: boolean;
};

export function SermonDetailEvaluationActions({
  sermonId,
  completeEvaluations,
  reportMode,
  entitlement,
  hasActiveEvaluation,
  isMentoredMentee = false,
  mentoringDebriefAllowed = false,
}: SermonDetailEvaluationActionsProps) {
  const grouped = useMemo(
    () => groupCompleteEvaluationsByMode(completeEvaluations),
    [completeEvaluations],
  );
  const [rerunPromptMode, setRerunPromptMode] =
    useState<ReportMode | null>(null);
  const pendingRunRef = useRef<(() => void) | null>(null);
  const pendingModeRef = useRef<ReportMode | null>(null);

  function handleRunClick(mode: ReportMode, run: () => void) {
    if (grouped[mode].latest) {
      setRerunPromptMode(mode);
      pendingRunRef.current = run;
      pendingModeRef.current = mode;
      return;
    }

    run();
  }

  function handleConfirmRerun() {
    pendingRunRef.current?.();
    pendingRunRef.current = null;
    pendingModeRef.current = null;
    setRerunPromptMode(null);
  }

  function handleCancelRerun() {
    pendingRunRef.current = null;
    pendingModeRef.current = null;
    setRerunPromptMode(null);
  }

  const showRerunPrompt = rerunPromptMode != null;
  const rerunModeLabel = rerunPromptMode
    ? modeDisplayName(rerunPromptMode)
    : "";
  const showDebriefAction = mentoringDebriefAllowed && !isMentoredMentee;
  // When both actions are shown, the diagnostic button always runs Evaluation
  // and the second runs Debrief — independent of the result tabs.
  const evaluationMode: ReportMode = showDebriefAction
    ? "diagnostic"
    : reportMode;
  const evaluationLabel = `Run ${modeDisplayName(evaluationMode)}`;

  return (
    <div className="mt-8 flex max-w-xl flex-col items-start gap-4">
      {showRerunPrompt ? (
        <div className="w-full">
          <p
            className="text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            You&apos;ve already run {rerunModeLabel} on this sermon. Run it
            again?
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleConfirmRerun}
              className="rounded px-4 py-2 text-[13px] font-semibold"
              style={{
                ...uiFont,
                background: "var(--sc-ink)",
                color: "#faf8f3",
              }}
            >
              Run it again
            </button>
            <button
              type="button"
              onClick={handleCancelRerun}
              className="border-0 bg-transparent p-0 text-[13px] underline-offset-2 hover:underline"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="w-full">
        <div className="flex flex-wrap items-start gap-3">
          <EvaluateButton
            sermonId={sermonId}
            entitlement={entitlement}
            hasActiveEvaluation={hasActiveEvaluation}
            reportMode={evaluationMode}
            embedded
            hideCreditLine
            buttonLabel={evaluationLabel}
            onRunClick={(run) => handleRunClick(evaluationMode, run)}
            disabled={showRerunPrompt}
            isMentoredMentee={isMentoredMentee}
          />
          {showDebriefAction ? (
            <EvaluateButton
              sermonId={sermonId}
              entitlement={entitlement}
              hasActiveEvaluation={hasActiveEvaluation}
              reportMode="debrief"
              embedded
              hideCreditLine
              buttonLabel="Run The Mentoring Debrief"
              onRunClick={(run) => handleRunClick("debrief", run)}
              disabled={showRerunPrompt}
            />
          ) : null}
        </div>
        {!isMentoredMentee ? (
          <EvaluationCreditLine entitlement={entitlement} />
        ) : null}
      </div>
    </div>
  );
}
