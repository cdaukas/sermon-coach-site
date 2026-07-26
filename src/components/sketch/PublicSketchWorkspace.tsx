"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SketchIntakeForm,
  type SketchIntakeHeaderCopy,
} from "@/components/sketch/SketchIntakeForm";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import { startPathWithClaim } from "@/lib/auth/start";
import type {
  SketchApiResponse,
  SketchField,
  SketchIntake,
  SketchStatus,
  SketchStatusMap,
} from "@/lib/sketch/types";
import { SKETCH_FIELDS } from "@/lib/sketch/types";

const uiFont = { fontFamily: "var(--font-ui)" };

const SAVE_FAILURE_COPY =
  "That didn't go through. Your read is still here. Try again in a moment.";

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

type SketchSavePayload = {
  prompt_version: string;
  mode?: "find" | "press";
  seam_hub?: SketchField;
  seam_spokes?: string[];
  status_ache?: SketchStatus;
  status_big_idea?: SketchStatus;
  status_gospel_turn?: SketchStatus;
  status_points?: SketchStatus;
  status_one_person?: SketchStatus;
  status_ending?: SketchStatus;
};

type Phase =
  | { kind: "intake" }
  | { kind: "loading"; intake: SketchIntake }
  | {
      kind: "report";
      intake: SketchIntake;
      read: string;
      status: SketchStatusMap;
      save: SketchSavePayload;
    };

type SaveUi = { kind: "idle" } | { kind: "saving" } | { kind: "error" };

function statusFieldsFromMap(
  status: SketchStatusMap,
): Pick<
  SketchSavePayload,
  | "status_ache"
  | "status_big_idea"
  | "status_gospel_turn"
  | "status_points"
  | "status_one_person"
  | "status_ending"
> {
  const out: Record<string, SketchStatus> = {};
  for (const f of SKETCH_FIELDS) {
    const v = status[f];
    if (v) out[`status_${f}`] = v;
  }
  return out;
}

function savePayloadFromRun(data: SketchApiResponse): SketchSavePayload | null {
  const prompt_version = data.prompt_version?.trim();
  if (!prompt_version) return null;

  const fromTelemetry = statusFieldsFromMap({
    ache: data.status_ache,
    big_idea: data.status_big_idea,
    gospel_turn: data.status_gospel_turn,
    points: data.status_points,
    one_person: data.status_one_person,
    ending: data.status_ending,
  });
  const fromStatus = statusFieldsFromMap(data.status ?? {});

  return {
    prompt_version,
    mode: data.mode,
    seam_hub: data.seam_hub,
    seam_spokes: data.seam_spokes,
    ...fromStatus,
    ...fromTelemetry,
  };
}

function SaveReadCta({
  intake,
  read,
  save,
}: {
  intake: SketchIntake;
  read: string;
  save: SketchSavePayload;
}) {
  const router = useRouter();
  const [ui, setUi] = useState<SaveUi>({ kind: "idle" });

  async function handleCreateAccount() {
    setUi({ kind: "saving" });

    try {
      const res = await fetch("/api/sketch/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_passage: intake.primary_passage,
          ache: intake.ache,
          big_idea: intake.big_idea,
          gospel_turn: intake.gospel_turn,
          points: intake.points,
          one_person: intake.one_person,
          ending: intake.ending,
          read_output: read,
          ...save,
        }),
      });

      const data = (await res.json()) as {
        token?: string;
        error?: string;
        reason?: string;
      };

      if (!res.ok || !data.token) {
        setUi({ kind: "error" });
        return;
      }

      // Cookie is set by /api/sketch/save. Stage is invisible — go straight to signup.
      router.push(startPathWithClaim(data.token));
    } catch {
      setUi({ kind: "error" });
    }
  }

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
        Want to keep this read? Nothing is stored until you ask.
      </p>
      {ui.kind === "error" ? (
        <p
          className="mb-3 rounded border px-4 py-3 text-[14px]"
          style={{
            ...uiFont,
            color: "var(--sc-error)",
            background: "var(--sc-error-bg)",
            borderColor: "var(--sc-error)",
          }}
          role="alert"
        >
          {SAVE_FAILURE_COPY}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleCreateAccount}
        disabled={ui.kind === "saving"}
        className="rounded border px-5 py-3 text-[14px] font-semibold tracking-wide transition-opacity disabled:opacity-60"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "var(--sc-bg)",
          borderColor: "var(--sc-ink)",
          cursor: ui.kind === "saving" ? "wait" : "pointer",
        }}
      >
        Create a free account to keep this read
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

      const save = savePayloadFromRun(data);
      if (!save) {
        setPhase({ kind: "intake" });
        setError("The read could not be generated. Try again.");
        return;
      }

      setPhase({
        kind: "report",
        intake,
        read: data.read ?? "",
        status: data.status ?? {},
        save,
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
        afterRead={
          <SaveReadCta
            intake={phase.intake}
            read={phase.read}
            save={phase.save}
          />
        }
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
