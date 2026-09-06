"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generateMovementReportAction,
  lockMovementBaselineAction,
} from "@/lib/movement/actions";
import { uiFont } from "@/components/evaluation/shared";

export function LockBaselineButton() {
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
            const result = await lockMovementBaselineAction();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Locking…" : "Lock work quarter from prep card"}
      </button>
      {error ? (
        <p className="mt-2 text-[14px]" style={{ ...uiFont, color: "#8b3a3a" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function GenerateMovementButton() {
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
            const result = await generateMovementReportAction();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Building report…" : "Build movement report"}
      </button>
      {error ? (
        <p className="mt-2 text-[14px]" style={{ ...uiFont, color: "#8b3a3a" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
