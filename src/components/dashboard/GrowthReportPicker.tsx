"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { orderEvaluationIdsByCompletedAt } from "@/lib/evaluation/growth-report-ordering";
import type { RecentCompleteEvaluationItem } from "@/lib/evaluation/growth-report-types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const selectChevronSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%234a5568' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

const selectClassName =
  "w-full cursor-pointer rounded border px-[14px] py-[11px] pr-10 text-[15px] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[var(--sc-accent)] focus-visible:border-[var(--sc-accent)] focus-visible:ring-2 focus-visible:ring-[var(--sc-accent)]/20";

const selectStyle: CSSProperties = {
  ...uiFont,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundColor: "var(--sc-panel)",
  backgroundImage: selectChevronSvg,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  backgroundSize: "12px 12px",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
};

type GrowthReportPickerProps = {
  options: RecentCompleteEvaluationItem[];
  selectedBaselineId: string;
  selectedCurrentId: string;
  reportVisible?: boolean;
  baselineTitle?: string;
  currentTitle?: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

export function formatGrowthReportOptionLabel(
  item: RecentCompleteEvaluationItem,
): string {
  const passage = item.primaryPassage?.trim() || "No passage";
  return `${item.sermonTitle} · ${passage} · ${formatDate(item.completedAt)}`;
}

export function GrowthReportPicker({
  options,
  selectedBaselineId,
  selectedCurrentId,
  reportVisible = false,
  baselineTitle,
  currentTitle,
}: GrowthReportPickerProps) {
  const router = useRouter();
  const [baselineId, setBaselineId] = useState(selectedBaselineId);
  const [currentId, setCurrentId] = useState(selectedCurrentId);
  const [pickerExpanded, setPickerExpanded] = useState(!reportVisible);

  useEffect(() => {
    setBaselineId(selectedBaselineId);
    setCurrentId(selectedCurrentId);
  }, [selectedBaselineId, selectedCurrentId]);

  useEffect(() => {
    if (reportVisible) {
      setPickerExpanded(false);
    }
  }, [reportVisible, selectedBaselineId, selectedCurrentId]);

  const baselineOption = useMemo(
    () => options.find((option) => option.evaluationId === baselineId),
    [options, baselineId],
  );
  const currentOption = useMemo(
    () => options.find((option) => option.evaluationId === currentId),
    [options, currentId],
  );

  const sameSermon =
    baselineOption != null &&
    currentOption != null &&
    baselineOption.sermonId === currentOption.sermonId;

  function handleGenerate() {
    if (sameSermon) {
      return;
    }

    const ordered = orderEvaluationIdsByCompletedAt(
      options,
      baselineId,
      currentId,
    );

    router.push(
      `/dashboard/growth?baseline=${ordered.baselineEvaluationId}&current=${ordered.currentEvaluationId}`,
    );
  }

  if (reportVisible && !pickerExpanded && baselineTitle && currentTitle) {
    return (
      <section
        className="flex flex-wrap items-center justify-between gap-3 rounded border px-4 py-3"
        style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
      >
        <p className="text-[14px] leading-relaxed" style={{ ...uiFont, color: "var(--sc-ink)" }}>
          Comparing{" "}
          <span className="font-semibold" style={{ ...serifFont }}>
            {baselineTitle}
          </span>
          <span className="mx-2" style={{ color: "var(--sc-ink-soft)" }} aria-hidden>
            →
          </span>
          <span className="font-semibold" style={{ ...serifFont }}>
            {currentTitle}
          </span>
        </p>
        <button
          type="button"
          className="rounded px-3 py-1.5 text-[13px] font-medium no-underline transition-opacity hover:opacity-80"
          style={{
            ...uiFont,
            color: "var(--sc-accent)",
            background: "var(--sc-accent-pale)",
          }}
          onClick={() => setPickerExpanded(true)}
        >
          Change selection
        </button>
      </section>
    );
  }

  return (
    <section
      className="rounded border px-6 py-6"
      style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
    >
      <h2
        className="mb-2 text-[20px] font-semibold"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Choose two sermons to compare
      </h2>
      <p
        className="mb-6 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Baseline is the earlier sermon; most recent is where you are now. Pick two
        different sermons, then generate the report.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Baseline (A)
          </span>
          <select
            className={selectClassName}
            style={selectStyle}
            value={baselineId}
            onChange={(event) => setBaselineId(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.evaluationId} value={option.evaluationId}>
                {formatGrowthReportOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Most recent (B)
          </span>
          <select
            className={selectClassName}
            style={selectStyle}
            value={currentId}
            onChange={(event) => setCurrentId(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.evaluationId} value={option.evaluationId}>
                {formatGrowthReportOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sameSermon ? (
        <p
          className="mt-4 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          role="status"
        >
          Choose two different sermons. The same sermon cannot fill both slots.
        </p>
      ) : null}

      <button
        type="button"
        className="mt-6 rounded px-5 py-3 text-[13px] font-semibold tracking-wide transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          ...uiFont,
          background: "var(--sc-accent)",
          color: "var(--sc-panel)",
        }}
        disabled={sameSermon}
        onClick={handleGenerate}
      >
        Generate Growth Report
      </button>
    </section>
  );
}
