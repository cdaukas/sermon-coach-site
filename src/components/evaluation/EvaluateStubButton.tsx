"use client";

import { useState, useTransition } from "react";
import { requestEvaluation } from "@/lib/evaluation/actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluateButtonProps = {
  sermonId: string;
};

export function EvaluateStubButton({ sermonId }: EvaluateButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestEvaluation(sermonId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded px-5 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "#faf8f3",
        }}
      >
        {pending ? "Evaluating…" : "Evaluate sermon"}
      </button>
      {error ? (
        <p className="mt-3 text-[13px]" style={{ ...uiFont, color: "var(--sc-error)" }}>
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
        Usually takes a few minutes. Keep this tab open.
      </p>
    </div>
  );
}
