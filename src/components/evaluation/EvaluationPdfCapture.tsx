"use client";

import { useEffect } from "react";

/** Marks the document for screen-fidelity PDF capture (?pdf=1). */
export function EvaluationPdfCapture() {
  useEffect(() => {
    document.documentElement.dataset.pdfCapture = "1";
    return () => {
      delete document.documentElement.dataset.pdfCapture;
    };
  }, []);

  return null;
}
