"use client";

import { useState } from "react";
import { SketchIntakeForm } from "@/components/sketch/SketchIntakeForm";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import type {
  SketchApiResponse,
  SketchIntake,
  SketchStatusMap,
} from "@/lib/sketch/types";

const uiFont = { fontFamily: "var(--font-ui)" };

type Phase =
  | { kind: "intake" }
  | { kind: "loading"; intake: SketchIntake }
  | {
      kind: "report";
      intake: SketchIntake;
      read: string;
      status: SketchStatusMap;
    };

export function SketchWorkspace() {
  const [phase, setPhase] = useState<Phase>({ kind: "intake" });
  const [error, setError] = useState<string | null>(null);

  async function runSketch(intake: SketchIntake) {
    setError(null);
    setPhase({ kind: "loading", intake });

    try {
      const res = await fetch("/api/readiness-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });

      const data = (await res.json()) as SketchApiResponse & { error?: string };

      if (!res.ok) {
        setPhase({ kind: "intake" });
        setError(data.error ?? "The read could not be generated. Try again.");
        return;
      }

      setPhase({
        kind: "report",
        intake,
        read: data.read ?? "",
        status: data.status ?? {},
      });
    } catch {
      setPhase({ kind: "intake" });
      setError("The read could not be generated. Try again.");
    }
  }

  if (phase.kind === "loading") {
    return (
      <div className="mx-auto max-w-[640px] py-16 text-center">
        <p
          className="mb-2 text-[18px] font-semibold"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          Reading your six answers
        </p>
        <p
          className="text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          This usually takes under a minute. Stay on this page.
        </p>
      </div>
    );
  }

  if (phase.kind === "report") {
    return (
      <SketchReportView
        intake={phase.intake}
        read={phase.read}
        status={phase.status}
        onStartAnother={() => {
          setError(null);
          setPhase({ kind: "intake" });
        }}
      />
    );
  }

  return (
    <SketchIntakeForm
      submitting={false}
      error={error}
      onSubmit={runSketch}
    />
  );
}
