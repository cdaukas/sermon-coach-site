"use client";

const uiFont = { fontFamily: "var(--font-ui)" };

const primaryButtonClass =
  "rounded border px-4 py-2 text-[13px] font-semibold tracking-wide transition-all";

const primaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
  cursor: "pointer",
} as const;

function handlePrint() {
  document
    .querySelectorAll(".evaluation-report details")
    .forEach((node) => node.setAttribute("open", ""));

  window.print();
}

export function EvaluationPrintButtons() {
  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className={primaryButtonClass}
        style={primaryButtonStyle}
      >
        Print
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className={primaryButtonClass}
        style={secondaryButtonStyle}
      >
        Download PDF
      </button>
    </>
  );
}
