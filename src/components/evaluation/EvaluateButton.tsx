"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { requestEvaluation } from "@/lib/evaluation/actions";
import type { EvaluationEntitlement } from "@/lib/evaluation/quota";
import { SubscribeToEvaluate } from "./SubscribeToEvaluate";

const uiFont = { fontFamily: "var(--font-ui)" };
const POLL_MS = 3000;

type EvaluateButtonProps = {
  sermonId: string;
  entitlement: EvaluationEntitlement | null;
  hasActiveEvaluation: boolean;
};

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function EvaluateButton({
  sermonId,
  entitlement,
  hasActiveEvaluation,
}: EvaluateButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const checkStatus = useCallback(
    async (evaluationId: string, expectedSermonId: string) => {
      const response = await fetch(`/api/evaluations/${evaluationId}`);

      if (!response.ok) {
        throw new Error("Could not check evaluation status.");
      }

      const data = (await response.json()) as {
        status: string;
        errorMessage: string | null;
        sermonId: string;
      };

      if (data.status === "complete") {
        stopPolling();
        router.push(
          `/dashboard/sermons/${expectedSermonId}/evaluations/${evaluationId}`,
        );
        return;
      }

      if (data.status === "failed") {
        stopPolling();
        setError(
          data.errorMessage ?? "We couldn't generate a valid evaluation.",
        );
      }
    },
    [router, stopPolling],
  );

  const startPolling = useCallback(
    (evaluationId: string, expectedSermonId: string) => {
      setPolling(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((seconds) => seconds + 1);
      }, 1000);

      void checkStatus(evaluationId, expectedSermonId).catch((pollError) => {
        stopPolling();
        setError(
          pollError instanceof Error
            ? pollError.message
            : "Something went wrong while waiting.",
        );
      });

      pollRef.current = setInterval(() => {
        void checkStatus(evaluationId, expectedSermonId).catch((pollError) => {
          stopPolling();
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Something went wrong while waiting.",
          );
        });
      }, POLL_MS);
    },
    [checkStatus, stopPolling],
  );

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestEvaluation(sermonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      startPolling(result.evaluationId, result.sermonId);
    });
  }

  const busy = pending || polling;
  const canEvaluate = entitlement?.canEvaluate ?? false;
  const usage = entitlement?.usage;

  if (!canEvaluate) {
    return (
      <div className="mt-8">
        <SubscribeToEvaluate />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {polling ? (
        <div
          className="mb-4 rounded border px-5 py-4"
          style={{
            background: "var(--sc-accent-pale)",
            borderColor: "var(--sc-rule)",
          }}
          role="status"
          aria-live="polite"
        >
          <p
            className="text-[13px] font-semibold"
            style={{ ...uiFont, color: "var(--sc-ink)" }}
          >
            Evaluating your sermon…
          </p>
          <p className="mt-1 text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
            This usually takes 2–4 minutes. Keep this tab open.
          </p>
          <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
            Elapsed: {formatElapsed(elapsed)}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={busy || hasActiveEvaluation}
        className="rounded px-5 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "#faf8f3",
        }}
      >
        {pending
          ? "Starting…"
          : polling
            ? "Evaluating…"
            : "Evaluate sermon"}
      </button>

      {entitlement?.creditSource === "free" && entitlement.freeRemaining > 0 ? (
        <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          {entitlement.freeRemaining} free evaluation
          {entitlement.freeRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}

      {usage && entitlement?.creditSource === "subscription" ? (
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
