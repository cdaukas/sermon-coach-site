"use client";

import { useState } from "react";
import {
  SketchIntakeForm,
  type SketchIntakeHeaderCopy,
} from "@/components/sketch/SketchIntakeForm";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import type {
  SketchApiResponse,
  SketchIntake,
  SketchStatusMap,
} from "@/lib/sketch/types";

const uiFont = { fontFamily: "var(--font-ui)" };

const PUBLIC_HEADER: SketchIntakeHeaderCopy = {
  eyebrow: "THE SKETCH",
  heading: "A read on your sermon before you build it.",
  subhead:
    "Answer six questions about the passage and the people you're preaching to. You'll get back an honest read on where the sermon is solid and where it's still thin, before you write a word.",
  note: "No account needed.",
};

const RATE_LIMIT_COPY: Record<string, string> = {
  cooldown: "Give it a moment and try again.",
  daily_ip: "You've reached today's limit. Try again tomorrow.",
  daily_sitewide: "The Sketch is busy right now. Try again in a little while.",
};

type Phase =
  | { kind: "intake" }
  | { kind: "loading"; intake: SketchIntake }
  | {
      kind: "report";
      intake: SketchIntake;
      read: string;
      status: SketchStatusMap;
    };

function SaveReadPlaceholder() {
  return (
    <div
      className="rounded border px-5 py-5"
      style={{
        borderColor: "var(--sc-rule)",
        background: "var(--sc-bg)",
      }}
    >
      <p
        className="mb-3 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Want to keep this read? Save is coming next.
      </p>
      {/* HOLD — save wiring lands in the next branch (/api/sketch/save + claim). */}
      <button
        type="button"
        className="rounded border px-5 py-3 text-[14px] font-semibold tracking-wide"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "var(--sc-bg)",
          borderColor: "var(--sc-ink)",
          cursor: "default",
        }}
      >
        Save this read
      </button>
    </div>
  );
}

export function PublicSketchWorkspace() {
  const [phase, setPhase] = useState<Phase>({ kind: "intake" });
  const [error, setError] = useState<string | null>(null);

  async function runSketch(intake: SketchIntake) {
    setError(null);
    setPhase({ kind: "loading", intake });

    try {
      const res = await fetch("/api/sketch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });

      const data = (await res.json()) as SketchApiResponse & {
        error?: string;
        reason?: string;
      };

      if (!res.ok) {
        setPhase({ kind: "intake" });
        if (res.status === 429 && data.reason && RATE_LIMIT_COPY[data.reason]) {
          setError(RATE_LIMIT_COPY[data.reason]);
        } else {
          setError(data.error ?? "The read could not be generated. Try again.");
        }
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
        afterRead={<SaveReadPlaceholder />}
      />
    );
  }

  return (
    <SketchIntakeForm
      submitting={false}
      error={error}
      onSubmit={runSketch}
      header={PUBLIC_HEADER}
    />
  );
}
