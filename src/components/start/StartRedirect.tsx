"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ACQUISITION_SOURCE_OPTIONS,
  setAcquisitionSource,
  type AcquisitionSource,
} from "@/lib/auth/acquisition-source";
import { START_DESTINATION } from "@/lib/auth/start";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export function StartRedirect() {
  const router = useRouter();
  const [selected, setSelected] = useState<AcquisitionSource | null>(null);
  const [otherDetail, setOtherDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);

    const shouldWrite =
      selected !== null &&
      (selected !== "other" || otherDetail.trim().length > 0);

    if (shouldWrite && selected) {
      await setAcquisitionSource(
        selected,
        selected === "other" ? otherDetail : null,
      );
    }

    router.push(START_DESTINATION);
  }

  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <header className="mx-auto w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-block text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-8 py-9"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <h1
            className="text-[1.35rem] font-semibold leading-snug tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            One quick question: how did you hear about The Sermon Coach?
          </h1>
          <p
            className="mt-2.5 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            This helps me see what&apos;s working. Skip it if you&apos;d rather.
          </p>

          <div
            className="mt-6 flex flex-col gap-2"
            role="radiogroup"
            aria-label="How did you hear about The Sermon Coach?"
          >
            {ACQUISITION_SOURCE_OPTIONS.map((option) => {
              const isSelected = selected === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={submitting}
                  onClick={() => setSelected(option.key)}
                  className="rounded border px-4 py-3 text-left text-[14px] leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    ...uiFont,
                    background: isSelected
                      ? "var(--sc-accent-pale)"
                      : "var(--sc-panel)",
                    borderColor: isSelected
                      ? "var(--sc-accent)"
                      : "var(--sc-rule)",
                    color: "var(--sc-ink)",
                    boxShadow: isSelected ? "var(--sc-shadow-lift)" : "none",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {selected === "other" ? (
            <div className="mt-3">
              <label htmlFor="acquisition-other-detail" className="sr-only">
                Tell us how you heard about us
              </label>
              <input
                id="acquisition-other-detail"
                type="text"
                value={otherDetail}
                onChange={(event) => setOtherDetail(event.target.value)}
                disabled={submitting}
                placeholder="Where did you hear about it?"
                maxLength={200}
                className="w-full rounded border px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20 disabled:opacity-60"
                style={{
                  ...uiFont,
                  background: "var(--sc-panel)",
                  borderColor: "var(--sc-rule)",
                  color: "var(--sc-ink)",
                }}
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="mt-7 w-full rounded border px-7 py-3.5 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            {submitting ? "Starting…" : "Start my first evaluation"}
          </button>
        </div>
      </main>
    </div>
  );
}
