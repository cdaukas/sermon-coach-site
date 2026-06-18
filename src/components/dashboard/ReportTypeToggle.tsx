"use client";

import type { StashedReportMode } from "@/lib/evaluation/context";

const uiFont = { fontFamily: "var(--font-ui)" };

const REPORT_TYPE_OPTIONS = [
  { value: "diagnostic", label: "Personal" },
  { value: "coaching", label: "Mentoring" },
] as const satisfies ReadonlyArray<{
  value: StashedReportMode;
  label: string;
}>;

const REPORT_TYPE_DESCRIPTORS: Record<StashedReportMode, string> = {
  diagnostic: "An assessment of your own preaching.",
  coaching: "An assessment to hand the preacher you're mentoring. Same rubric, written as a coaching report.",
};

type ReportTypeToggleProps = {
  value: StashedReportMode;
  onChange: (value: StashedReportMode) => void;
  disabled?: boolean;
};

export function ReportTypeToggle({
  value,
  onChange,
  disabled = false,
}: ReportTypeToggleProps) {
  return (
    <div className="w-full md:w-auto">
      <div
        className="inline-flex w-full rounded border p-1 md:w-auto"
        style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
        role="radiogroup"
        aria-label="Report type"
      >
        {REPORT_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className="flex-1 rounded px-4 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
              style={{
                ...uiFont,
                background: selected ? "var(--sc-panel)" : "transparent",
                color: selected ? "var(--sc-ink)" : "var(--sc-ink-soft)",
                boxShadow: selected ? "var(--sc-shadow-lift)" : "none",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p
        className="mt-2 text-[13px] leading-relaxed md:text-right"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {REPORT_TYPE_DESCRIPTORS[value]}
      </p>
    </div>
  );
}
