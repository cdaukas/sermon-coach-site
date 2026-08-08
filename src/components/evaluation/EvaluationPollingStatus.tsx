"use client";

import { useEffect, useState } from "react";
import {
  stageLabelForElapsed,
  slideIndexForElapsed,
  timeEstimateForElapsed,
  WAIT_SLIDES,
} from "@/components/evaluation/waitStateContent";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type EvaluationPollingStatusProps = {
  elapsed: number;
  className?: string;
};

export function EvaluationPollingStatus({
  elapsed,
  className = "mb-4",
}: EvaluationPollingStatusProps) {
  const stageLabel = stageLabelForElapsed(elapsed);
  const timeEstimate = timeEstimateForElapsed(elapsed);
  const slideIndex = slideIndexForElapsed(elapsed);
  const [displayIndex, setDisplayIndex] = useState(slideIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (slideIndex === displayIndex) return;

    setVisible(false);
    const swap = window.setTimeout(() => {
      setDisplayIndex(slideIndex);
      setVisible(true);
    }, 180);

    return () => window.clearTimeout(swap);
  }, [slideIndex, displayIndex]);

  const slide = WAIT_SLIDES[displayIndex] ?? WAIT_SLIDES[0];

  return (
    <div
      className={`rounded border-l-[3px] border px-6 py-6 ${className}`.trim()}
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
        borderLeftColor: "var(--sc-accent)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
      role="status"
      aria-live="polite"
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {stageLabel}
      </p>
      <p
        className="mt-1.5 text-[12px] leading-snug"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {timeEstimate}
      </p>

      <div
        className="mt-5 border-t pt-5"
        style={{
          borderColor: "var(--sc-rule)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(3px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        <h3
          className="text-[22px] font-normal leading-snug tracking-[-0.01em]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {slide.title}
        </h3>
        <p
          className="mt-2.5 max-w-[38rem] text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {slide.body}
        </p>
      </div>
    </div>
  );
}
