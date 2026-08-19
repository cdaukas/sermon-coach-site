"use client";

import { EvaluationAccessGate } from "@/components/evaluation/EvaluationAccessGate";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { SermonForm } from "./SermonForm";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type NewSermonWorkspaceProps = {
  entitlement: EvaluationEntitlement | null;
  isMentoredMentee?: boolean;
  churchName?: string | null;
  spanishEnabled?: boolean;
};

export function NewSermonWorkspace({
  entitlement,
  isMentoredMentee = false,
  churchName = null,
  spanishEnabled = false,
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
      </div>

      {!isMentoredMentee ? (
        <EvaluationAccessGate entitlement={entitlement} className="mb-8" />
      ) : null}

      {showForm ? (
        <SermonForm
          entitlement={entitlement}
          isMentoredMentee={isMentoredMentee}
          churchName={churchName}
          spanishEnabled={spanishEnabled}
        />
      ) : null}
    </>
  );
}
