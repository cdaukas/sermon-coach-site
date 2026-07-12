"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 3000;

export function formatEvaluationElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

type UseEvaluationPollingOptions = {
  onComplete?: (evaluationId: string, sermonId: string) => void;
  onFailed?: (message: string) => void;
};

export function useEvaluationPolling(options: UseEvaluationPollingOptions = {}) {
  const router = useRouter();
  const { onComplete, onFailed } = options;
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
        if (onComplete) {
          onComplete(evaluationId, expectedSermonId);
        } else {
          router.push(
            `/dashboard/sermons/${expectedSermonId}/evaluations/${evaluationId}`,
          );
        }
        return;
      }

      if (data.status === "failed") {
        stopPolling();
        const message =
          data.errorMessage ?? "We couldn't generate a valid evaluation.";
        setError(message);
        onFailed?.(message);
      }
    },
    [onComplete, onFailed, router, stopPolling],
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
        const message =
          pollError instanceof Error
            ? pollError.message
            : "Something went wrong while waiting.";
        setError(message);
        onFailed?.(message);
      });

      pollRef.current = setInterval(() => {
        void checkStatus(evaluationId, expectedSermonId).catch((pollError) => {
          stopPolling();
          const message =
            pollError instanceof Error
              ? pollError.message
              : "Something went wrong while waiting.";
          setError(message);
          onFailed?.(message);
        });
      }, POLL_MS);
    },
    [checkStatus, stopPolling, onFailed],
  );

  return {
    polling,
    elapsed,
    error,
    setError,
    startPolling,
    stopPolling,
    clearError: () => setError(null),
  };
}
