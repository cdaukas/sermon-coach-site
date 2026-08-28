"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EvaluationPollingStatus } from "@/components/evaluation/EvaluationPollingStatus";
import { useEvaluationPolling } from "@/components/evaluation/useEvaluationPolling";
import {
  displayEvaluationError,
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/** ~5 minutes — stop polling rather than spinning forever. */
const POLL_CEILING_MS = 5 * 60 * 1000;
const SUPPORT_EMAIL = "chris@sermoncoach.com";

type IncompleteEvaluationPollerProps = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  backHref: string;
  backLabel: string;
  initialStatus: string;
  initialErrorMessage: string | null;
  outputLanguage?: OutputLanguage;
};

export function IncompleteEvaluationPoller({
  evaluationId,
  sermonId,
  sermonTitle,
  backHref,
  backLabel,
  initialStatus,
  initialErrorMessage,
  outputLanguage = "en",
}: IncompleteEvaluationPollerProps) {
  const router = useRouter();
  const copy = evaluationReportCopy(outputLanguage);
  const [timedOut, setTimedOut] = useState(false);

  const handleComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  const {
    polling,
    elapsed,
    error,
    startPolling,
    stopPolling,
  } = useEvaluationPolling({
    onComplete: handleComplete,
    statusCheckFailedMessage: copy.pollStatusFailed,
    waitFailedMessage: copy.pollWaitFailed,
    evaluationFailedFallback: copy.evaluationFailedFallback,
  });

  const failedMessage =
    error ??
    (initialStatus === "failed"
      ? displayEvaluationError(
          initialErrorMessage ?? copy.evaluationFailedFallback,
          outputLanguage,
        )
      : null);
  const shouldPoll = !failedMessage && !timedOut;

  useEffect(() => {
    if (!shouldPoll) return;

    startPolling(evaluationId, sermonId);

    const ceiling = setTimeout(() => {
      stopPolling();
      setTimedOut(true);
    }, POLL_CEILING_MS);

    return () => {
      clearTimeout(ceiling);
      stopPolling();
    };
  }, [
    evaluationId,
    sermonId,
    shouldPoll,
    startPolling,
    stopPolling,
  ]);

  if (timedOut) {
    return (
      <div>
        <h1
          className="mb-3 text-[25px] font-semibold leading-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {copy.waitTimedOutTitle}
        </h1>
        <p
          className="mb-6 max-w-[400px] text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {copy.waitTimedOutLead}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline"
            style={{ color: "var(--sc-accent)" }}
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          {copy.waitTimedOutClose}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            {copy.reload}
          </button>
          <Link
            href="/dashboard"
            className="rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide no-underline"
            style={{
              ...uiFont,
              background: "transparent",
              color: "var(--sc-ink)",
              borderColor: "var(--sc-rule)",
            }}
          >
            {copy.backToYourSermons}
          </Link>
        </div>
      </div>
    );
  }

  if (failedMessage) {
    return (
      <div>
        <p
          className="mb-4 text-[15px]"
          style={{ ...uiFont, color: "var(--sc-error)" }}
        >
          {displayEvaluationError(failedMessage, outputLanguage)}
        </p>
        <Link
          href={backHref}
          className="inline-block text-[13px] font-medium no-underline hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          ← {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-3 text-[25px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {sermonTitle}
      </h1>
      <EvaluationPollingStatus
        elapsed={polling || elapsed > 0 ? elapsed : 0}
        className="mb-6"
        outputLanguage={outputLanguage}
      />
      <Link
        href={backHref}
        className="inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← {backLabel}
      </Link>
    </div>
  );
}
