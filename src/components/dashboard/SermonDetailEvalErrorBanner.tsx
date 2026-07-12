"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { messageForEvalErrorParam } from "@/lib/evaluation/eval-start-errors";

const uiFont = { fontFamily: "var(--font-ui)" };

type SermonDetailEvalErrorBannerProps = {
  evalError: string | null;
};

export function SermonDetailEvalErrorBanner({
  evalError,
}: SermonDetailEvalErrorBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const message = messageForEvalErrorParam(evalError);

  if (!message || dismissed) {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    router.replace(pathname);
  }

  return (
    <div
      className="mb-8 flex items-start justify-between gap-4 rounded border px-5 py-4"
      style={{
        background: "var(--sc-accent-pale)",
        borderColor: "var(--sc-rule)",
      }}
      role="alert"
    >
      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 border-0 bg-transparent p-0 text-[13px] underline-offset-2 hover:underline"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
