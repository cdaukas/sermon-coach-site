"use client";

import type { StashedReportMode } from "@/lib/evaluation/context";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const MODE_OPTIONS = [
  {
    value: "diagnostic",
    header: "The Evaluation",
    body: "An assessment of your own preaching.",
  },
  {
    value: "coaching",
    header: "The Mentoring Debrief",
    body: "A coaching report to hand the preacher you're mentoring. Same rubric.",
  },
] as const satisfies ReadonlyArray<{
  value: StashedReportMode;
  header: string;
  body: string;
}>;

type ModeSelectorProps = {
  value: StashedReportMode;
  onChange: (value: StashedReportMode) => void;
  disabled?: boolean;
};

export function ModeSelector({
  value,
  onChange,
  disabled = false,
}: ModeSelectorProps) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Evaluation mode"
    >
      {MODE_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className="rounded border px-5 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              ...uiFont,
              background: selected ? "var(--sc-accent-pale)" : "var(--sc-panel)",
              borderColor: selected ? "var(--sc-accent)" : "var(--sc-rule)",
              boxShadow: selected ? "var(--sc-shadow-lift)" : "none",
            }}
          >
            <p
              className="text-[15px] font-semibold"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {option.header}
            </p>
            <p
              className="mt-1.5 text-[13px] leading-relaxed"
              style={{ color: "var(--sc-ink-soft)" }}
            >
              {option.body}
            </p>
          </button>
        );
      })}
    </div>
  );
}
