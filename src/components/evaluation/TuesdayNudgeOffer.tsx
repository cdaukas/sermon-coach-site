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
  const [checked, setChecked] = useState(true);
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

      <label
        className="mt-0 flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
        style={{
          ...uiFont,
          color: "var(--sc-ink-mid)",
          opacity: pending ? 0.7 : 1,
          marginTop: error ? "1rem" : 0,
        }}
      >
        <input
          type="checkbox"
          name="tuesdayNudgeOffer"
          checked={checked}
          disabled={pending}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span
            className="block font-medium"
            style={{ color: "var(--sc-ink)" }}
          >
            Send me the Tuesday nudge
          </span>
          <span
            className="mt-1 block text-[13px] leading-relaxed"
            style={{ color: "var(--sc-ink-soft)" }}
          >
            A prompt each Tuesday to look back at Sunday and start next
            week&apos;s sketch. One email a week.
          </span>
        </span>
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void complete(checked)}
          className="cursor-pointer rounded border px-4 py-2 text-[13px] font-semibold disabled:cursor-wait disabled:opacity-70"
          style={{
            ...uiFont,
            background: "var(--sc-bg)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void complete(false)}
          className="cursor-pointer border-0 bg-transparent px-2 py-2 text-[13px] font-medium underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-70 disabled:no-underline"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Not now
        </button>
      </div>
    </section>
  );
}
