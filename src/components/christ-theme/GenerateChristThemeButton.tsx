"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateChristThemeAction } from "@/lib/christ-theme/actions";
import { uiFont } from "@/components/evaluation/shared";

export function GenerateChristThemeButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="rounded px-4 py-2.5 text-[14px] font-semibold"
        style={{
          ...uiFont,
          background: "var(--sc-accent)",
          color: "#fff",
          opacity: pending ? 0.7 : 1,
        }}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await generateChristThemeAction();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Building report…" : "Build Christ theme report"}
      </button>
      {error ? (
        <p className="mt-2 text-[14px]" style={{ ...uiFont, color: "#8b3a3a" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
