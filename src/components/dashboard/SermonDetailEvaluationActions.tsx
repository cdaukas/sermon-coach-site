"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EvaluateButton } from "@/components/evaluation/EvaluateButton";
import { EvaluationCreditLine } from "@/components/evaluation/EvaluationCreditLine";
import type { StashedReportMode } from "@/lib/evaluation/context";
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
  reportMode: StashedReportMode;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
};

export function SermonDetailEvaluationActions({
  sermonId,
  completeEvaluations,
  reportMode,
  entitlement,
  hasActiveEvaluation,
}: SermonDetailEvaluationActionsProps) {
  const grouped = useMemo(
    () => groupCompleteEvaluationsByMode(completeEvaluations),
    [completeEvaluations],
  );
  const [rerunPromptMode, setRerunPromptMode] =
    useState<StashedReportMode | null>(null);
  const pendingRunRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setRerunPromptMode(null);
    pendingRunRef.current = null;
  }, [reportMode]);

  function handleRunClick(run: () => void) {
    if (grouped[reportMode].latest) {
      setRerunPromptMode(reportMode);
      pendingRunRef.current = run;
      return;
    }

    run();
  }

  function handleConfirmRerun() {
    pendingRunRef.current?.();
    pendingRunRef.current = null;
    setRerunPromptMode(null);
  }

  function handleCancelRerun() {
    pendingRunRef.current = null;
    setRerunPromptMode(null);
  }

  const showRerunPrompt = rerunPromptMode === reportMode;
  const runButtonLabel = `Run ${modeDisplayName(reportMode)} evaluation`;

  return (
    <div className="mt-8 flex max-w-xl flex-col items-start gap-4">
      {showRerunPrompt ? (
        <div className="w-full">
          <p
            className="text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            You&apos;ve already run a {modeDisplayName(reportMode)} evaluation on
            this sermon. Run it again?
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
        <EvaluateButton
          sermonId={sermonId}
          entitlement={entitlement}
          hasActiveEvaluation={hasActiveEvaluation}
          reportMode={reportMode}
          embedded
          hideCreditLine
          buttonLabel={runButtonLabel}
          onRunClick={handleRunClick}
          disabled={showRerunPrompt}
        />
        <EvaluationCreditLine entitlement={entitlement} />
      </div>
    </div>
  );
}
