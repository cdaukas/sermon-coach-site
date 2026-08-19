"use client";

import {
  useCallback,
  useState,
  useTransition,
} from "react";
import {
  normalizeSermonContext,
  sermonContextStorageKey,
  type SermonContext,
  type ReportMode,
} from "@/lib/evaluation/context";
import { requestEvaluation } from "@/lib/evaluation/actions";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import {
  displayEvaluationError,
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import { EvaluationAccessGate } from "./EvaluationAccessGate";
import { EvaluationPollingStatus } from "./EvaluationPollingStatus";
import { useEvaluationPolling } from "./useEvaluationPolling";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluateButtonProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  reportMode: ReportMode;
  embedded?: boolean;
  hideCreditLine?: boolean;
  buttonLabel?: string;
  onRunClick?: (run: () => void) => void;
  disabled?: boolean;
  isMentoredMentee?: boolean;
  outputLanguage?: OutputLanguage;
};

export function EvaluateButton({
  sermonId,
  entitlement,
  hasActiveEvaluation,
  reportMode,
  embedded = false,
  hideCreditLine = false,
  buttonLabel = "Run Evaluation",
  onRunClick,
  disabled = false,
  isMentoredMentee = false,
  outputLanguage = "en",
}: EvaluateButtonProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePollFailed = useCallback(
    (message: string) => {
      setError(displayEvaluationError(message, outputLanguage));
    },
    [outputLanguage],
  );

  const { polling, elapsed, startPolling } = useEvaluationPolling({
    onFailed: handlePollFailed,
    statusCheckFailedMessage: copy.pollStatusFailed,
    waitFailedMessage: copy.pollWaitFailed,
    evaluationFailedFallback: copy.evaluationFailedFallback,
  });

  function readStashedContext(): SermonContext | undefined {
    const storageKey = sermonContextStorageKey(sermonId);
    const raw = sessionStorage.getItem(storageKey);
    sessionStorage.removeItem(storageKey);

    if (!raw) {
      return undefined;
    }

    try {
      return normalizeSermonContext(JSON.parse(raw) as SermonContext);
    } catch {
      return undefined;
    }
  }

  function runEvaluation() {
    setError(null);
    startTransition(async () => {
      const context = readStashedContext();
      const result = await requestEvaluation(
        sermonId,
        context,
        reportMode,
        outputLanguage,
      );
      if (!result.ok) {
        setError(displayEvaluationError(result.error, outputLanguage));
        return;
      }
      startPolling(
        result.debriefEvaluationId ?? result.evaluationId,
        result.sermonId,
      );
    });
  }

  function handleClick() {
    if (onRunClick) {
      onRunClick(runEvaluation);
      return;
    }

    runEvaluation();
  }

  const busy = pending || polling;
  const canEvaluate = entitlement?.canEvaluate ?? false;
  const mayRunEvaluation = isMentoredMentee || canEvaluate;
  const usage = entitlement?.usage;
  const rootClassName = embedded ? "" : "mt-8";
  const showCoachCreditLines = !hideCreditLine && !isMentoredMentee;

  if (!mayRunEvaluation) {
    return (
      <div className={rootClassName}>
        <EvaluationAccessGate
          entitlement={entitlement}
          outputLanguage={outputLanguage}
        />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      {polling ? (
        <EvaluationPollingStatus
          elapsed={elapsed}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {!polling ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={busy || hasActiveEvaluation || disabled}
          className="w-auto rounded border-0 text-[13px] font-semibold transition-opacity disabled:opacity-60"
          style={{
            ...uiFont,
            padding: "13px 26px",
            background: "#1a2332",
            color: "#faf8f3",
            borderRadius: 4,
          }}
        >
          {pending ? copy.starting : buttonLabel}
        </button>
      ) : null}

      {showCoachCreditLines &&
      entitlement?.creditSource === "free" &&
      entitlement.freeRemaining > 0 ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {entitlement.freeRemaining} free credit
          {entitlement.freeRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}

      {showCoachCreditLines &&
      entitlement?.packRemaining != null &&
      entitlement.packRemaining > 0 ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {entitlement.packRemaining} pack credit
          {entitlement.packRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}

      {showCoachCreditLines &&
      usage &&
      entitlement?.creditSource === "subscription" ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {usage.used} of {usage.limit} credits used this month
        </p>
      ) : null}

      {hasActiveEvaluation && !polling ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {copy.evaluationInProgress}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px]" style={{ ...uiFont, color: "var(--sc-error)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
