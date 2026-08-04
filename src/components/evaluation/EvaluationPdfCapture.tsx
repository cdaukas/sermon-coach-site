"use client";

import { useEffect } from "react";

/** Marks the document for Puppeteer wait + any residual document-level selectors. */
export function EvaluationPdfCapture() {
  useEffect(() => {
    document.documentElement.dataset.pdfCapture = "1";
    return () => {
      delete document.documentElement.dataset.pdfCapture;
    };
  }, []);

  return null;
}
