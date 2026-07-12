"use client";

import {
  formatEvaluationElapsed,
} from "@/components/evaluation/useEvaluationPolling";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationPollingStatusProps = {
  elapsed: number;
  className?: string;
};

export function EvaluationPollingStatus({
  elapsed,
  className = "mb-4",
}: EvaluationPollingStatusProps) {
  return (
    <div
      className={`rounded border px-5 py-4 ${className}`.trim()}
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
      <p
        className="mt-1 text-[13px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        This usually takes 2–4 minutes. Keep this tab open.
      </p>
      <p
        className="mt-2 text-[12px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Elapsed: {formatEvaluationElapsed(elapsed)}
      </p>
    </div>
  );
}
