"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  markTuesdayNudgeOfferSeen,
  saveEmailPreferences,
} from "@/lib/auth/profile-actions";
import {
  displayEvaluationError,
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import { uiFont } from "./shared";

type TuesdayNudgeOfferProps = {
  /** Live newsletter preference — always forwarded unchanged on opt-in. */
  newsletterOptedIn: boolean;
  outputLanguage?: OutputLanguage;
};

/**
 * Screen-only post-report offer for the Tuesday nudge.
 * Must stay out of PDF export: parent gates on !pdfCapture; .screen-only is backup.
 */
export function TuesdayNudgeOffer({
  newsletterOptedIn,
  outputLanguage = "en",
}: TuesdayNudgeOfferProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hidden) {
    return null;
  }

  async function complete(optIn: boolean) {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      if (optIn) {
        const prefResult = await saveEmailPreferences(newsletterOptedIn, true);
        if (!prefResult.ok) {
          setError(displayEvaluationError(prefResult.error, outputLanguage));
          return;
        }
      }

      const seenResult = await markTuesdayNudgeOfferSeen();
      if (!seenResult.ok) {
        setError(displayEvaluationError(seenResult.error, outputLanguage));
        return;
      }

      setHidden(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="screen-only mt-12 px-6 py-6 md:px-9"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
      data-tuesday-nudge-offer="1"
      aria-label={copy.tuesdayNudgeAria}
    >
      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <p
        className="text-[13px] leading-relaxed"
        style={{
          ...uiFont,
          color: "var(--sc-ink-soft)",
          marginTop: error ? "1rem" : 0,
        }}
      >
        {copy.tuesdayNudgeBody}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void complete(true)}
          className="cursor-pointer rounded border px-4 py-2 text-[13px] font-semibold disabled:cursor-wait disabled:opacity-70"
          style={{
            ...uiFont,
            background: "var(--sc-bg)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          {pending ? copy.saving : copy.tuesdayNudgeTitle}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void complete(false)}
          className="cursor-pointer border-0 bg-transparent px-2 py-2 text-[13px] font-medium underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-70 disabled:no-underline"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {copy.notNow}
        </button>
      </div>
    </section>
  );
}
