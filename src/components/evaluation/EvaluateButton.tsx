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
  type StashedReportMode,
} from "@/lib/evaluation/context";
import { requestEvaluation } from "@/lib/evaluation/actions";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { EvaluationAccessGate } from "./EvaluationAccessGate";
import { EvaluationPollingStatus } from "./EvaluationPollingStatus";
import { useEvaluationPolling } from "./useEvaluationPolling";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluateButtonProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
  reportMode: StashedReportMode;
  embedded?: boolean;
  hideCreditLine?: boolean;
  buttonLabel?: string;
  onRunClick?: (run: () => void) => void;
  disabled?: boolean;
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
}: EvaluateButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePollFailed = useCallback((message: string) => {
    setError(message);
  }, []);

  const { polling, elapsed, startPolling } = useEvaluationPolling({
    onFailed: handlePollFailed,
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
      const result = await requestEvaluation(sermonId, context, reportMode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      startPolling(result.evaluationId, result.sermonId);
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
  const usage = entitlement?.usage;
  const rootClassName = embedded ? "" : "mt-8";

  if (!canEvaluate) {
    return (
      <div className={rootClassName}>
        <EvaluationAccessGate entitlement={entitlement} />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      {polling ? <EvaluationPollingStatus elapsed={elapsed} /> : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={busy || hasActiveEvaluation || disabled}
        className="w-full rounded px-5 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60 lg:w-auto"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "#faf8f3",
        }}
      >
        {pending ? "Starting…" : polling ? "Evaluating…" : buttonLabel}
      </button>

      {!hideCreditLine && entitlement?.creditSource === "free" && entitlement.freeRemaining > 0 ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {entitlement.freeRemaining} free evaluation
          {entitlement.freeRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}

      {!hideCreditLine && entitlement?.packRemaining != null && entitlement.packRemaining > 0 ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {entitlement.packRemaining} pack evaluation
          {entitlement.packRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}

      {!hideCreditLine && usage && entitlement?.creditSource === "subscription" ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {usage.used} of {usage.limit} evaluations used this month
        </p>
      ) : null}

      {hasActiveEvaluation && !polling ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          An evaluation is already in progress for this sermon.
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
