"use client";

import { EvaluationAccessGate } from "@/components/evaluation/EvaluationAccessGate";
import type { ReportMode } from "@/lib/evaluation/context";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { SermonForm } from "./SermonForm";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type NewSermonWorkspaceProps = {
  entitlement: EvaluationEntitlement | null;
  defaultReportMode: ReportMode;
  isMentoredMentee?: boolean;
};

export function NewSermonWorkspace({
  entitlement,
  defaultReportMode,
  isMentoredMentee = false,
}: NewSermonWorkspaceProps) {
  const canEvaluate = entitlement?.canEvaluate ?? true;
  const showForm = isMentoredMentee || canEvaluate;

  return (
    <>
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Submit
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          New evaluation
        </h1>
        <p
          className="mt-3 text-base leading-relaxed"
          style={{
            ...serifFont,
            color: "var(--sc-ink-soft)",
            fontStyle: "italic",
          }}
        >
          Paste your manuscript or transcript. Formatting doesn&apos;t matter. We
          work from the words.
        </p>
      </div>

      {!isMentoredMentee ? (
        <EvaluationAccessGate entitlement={entitlement} className="mb-8" />
      ) : null}

      {showForm ? (
        <SermonForm
          entitlement={entitlement}
          defaultReportMode={defaultReportMode}
          isMentoredMentee={isMentoredMentee}
        />
      ) : null}
    </>
  );
}
