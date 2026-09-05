"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generatePrepCardAction } from "@/lib/prep-card/actions";
import { uiFont } from "@/components/evaluation/shared";

export function GeneratePrepCardButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="screen-only">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await generatePrepCardAction();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className="rounded border px-4 py-2 text-[13px] font-semibold tracking-wide transition-opacity disabled:opacity-60"
        style={{
          ...uiFont,
          borderColor: "var(--sc-ink)",
          background: "var(--sc-ink)",
          color: "#faf8f3",
        }}
      >
        {pending ? "Building card…" : "Build prep card"}
      </button>
      {error ? (
        <p
          className="mt-2 text-[13px]"
          style={{ ...uiFont, color: "var(--sc-error)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
