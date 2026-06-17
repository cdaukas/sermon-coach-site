"use client";

import { useState } from "react";
import {
  EvaluationAccessGate,
  EvaluationCreditNotice,
} from "@/components/evaluation/EvaluationAccessGate";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import type { StashedReportMode } from "@/lib/evaluation/context";
import { ReportTypeToggle } from "./ReportTypeToggle";
import { SermonForm } from "./SermonForm";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type NewSermonWorkspaceProps = {
  entitlement: EvaluationEntitlement | null;
};

export function NewSermonWorkspace({ entitlement }: NewSermonWorkspaceProps) {
  const [reportMode, setReportMode] = useState<StashedReportMode>("diagnostic");

  return (
    <>
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Submit
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <h1
            className="text-[32px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            New Sermon
          </h1>
          <ReportTypeToggle value={reportMode} onChange={setReportMode} />
        </div>
        <p
          className="mt-3 text-base leading-relaxed"
          style={{
            ...serifFont,
            color: "var(--sc-ink-soft)",
            fontStyle: "italic",
          }}
        >
          Select all, copy, and paste your manuscript or transcript below. Don&apos;t
          worry about formatting. Save the sermon, then run an evaluation.
        </p>
      </div>

      <EvaluationAccessGate entitlement={entitlement} className="mb-8" />
      <EvaluationCreditNotice entitlement={entitlement} className="mb-6" />

      <SermonForm reportMode={reportMode} />
    </>
  );
}
