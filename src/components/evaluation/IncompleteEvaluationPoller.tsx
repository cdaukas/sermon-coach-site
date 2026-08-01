"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  formatEvaluationElapsed,
  useEvaluationPolling,
} from "@/components/evaluation/useEvaluationPolling";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/** ~5 minutes — stop polling rather than spinning forever. */
const POLL_CEILING_MS = 5 * 60 * 1000;

type IncompleteEvaluationPollerProps = {
  evaluationId: string;
  sermonId: string;
  sermonTitle: string;
  backHref: string;
  backLabel: string;
  initialStatus: string;
  initialErrorMessage: string | null;
};

export function IncompleteEvaluationPoller({
  evaluationId,
  sermonId,
  sermonTitle,
  backHref,
  backLabel,
  initialStatus,
  initialErrorMessage,
}: IncompleteEvaluationPollerProps) {
  const router = useRouter();
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
  });

  const failedMessage =
    error ??
    (initialStatus === "failed"
      ? (initialErrorMessage ?? "We couldn't generate a valid evaluation.")
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
          This is taking longer than it should
        </h1>
        <p
          className="mb-6 max-w-[400px] text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          The evaluation has not come back yet. Nothing has been lost, and it may
          still finish. Reload in a few minutes, or email{" "}
          <a
            href="mailto:chris@sermoncoach.online"
            className="underline"
            style={{ color: "var(--sc-accent)" }}
          >
            chris@sermoncoach.online
          </a>{" "}
          and I will look at it.
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
            Reload
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
            Back to your sermons
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
          {failedMessage}
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
    <div role="status" aria-live="polite">
      <h1
        className="mb-3 text-[25px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {sermonTitle}
      </h1>
      <p
        className="mb-2 text-[13px] font-semibold"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        Evaluation in progress…
        {polling || elapsed > 0
          ? ` ${formatEvaluationElapsed(elapsed)}`
          : null}
      </p>
      <p
        className="mb-6 max-w-[420px] text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        This usually takes a few minutes. You can close this tab and get back to
        your week.
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
