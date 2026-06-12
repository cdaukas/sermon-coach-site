"use client";

const uiFont = { fontFamily: "var(--font-ui)" };

export function EvaluationPrintButton() {
  function handlePrint() {
    document
      .querySelectorAll(".evaluation-report details")
      .forEach((node) => node.setAttribute("open", ""));

    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded border px-4 py-2 text-[13px] font-semibold tracking-wide transition-all"
      style={{
        ...uiFont,
        background: "var(--sc-ink)",
        color: "var(--sc-bg)",
        borderColor: "var(--sc-ink)",
        cursor: "pointer",
      }}
    >
      Print / Save as PDF
    </button>
  );
}
