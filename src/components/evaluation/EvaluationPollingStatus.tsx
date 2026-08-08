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
      className={`rounded border px-5 py-5 ${className}`.trim()}
      style={{
        background: "var(--sc-accent-pale)",
        borderColor: "var(--sc-rule)",
      }}
      role="status"
      aria-live="polite"
    >
      <p
        className="text-[14px] font-semibold leading-snug"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {stageLabel}
      </p>
      <p
        className="mt-1.5 text-[13px] leading-snug"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {timeEstimate}
      </p>

      <div
        className="mt-5 border-t pt-4"
        style={{
          borderColor: "var(--sc-rule)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(3px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        <h3
          className="text-[18px] font-normal leading-snug tracking-[-0.01em]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {slide.title}
        </h3>
        <p
          className="mt-2 max-w-[38rem] text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {slide.body}
        </p>
      </div>
    </div>
  );
}
