"use client";

import { useState } from "react";
import Link from "next/link";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type SeatOption = {
  value: MentorSeatType;
  price: string;
  audience: string;
  detail: string;
};

export const SEAT_OPTIONS: SeatOption[] = [
  {
    value: "debrief",
    price: "$12/month",
    audience: "For someone in their first few years of preaching.",
    detail:
      "2 sermons per month. They receive the coaching debrief and How It Preaches. Their score is held until you release it.",
  },
  {
    value: "evaluation",
    price: "$25/month",
    audience:
      "For an experienced preacher who is ready to be measured against the rubric.",
    detail:
      "4 sermons per month. They see the complete evaluation, including their score.",
  },
];

/**
 * Two cards and one Continue. Continue is a plain link into the existing
 * /checkout?seat=… route, so all billing stays where it already lives.
 */
export function MentorSeatPicker({
  onClose,
  showCancel = true,
}: {
  onClose?: () => void;
  showCancel?: boolean;
}) {
  const [selected, setSelected] = useState<MentorSeatType | null>(null);

  return (
    <div>
      <div
        className="grid gap-4 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Seat type"
      >
        {SEAT_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          const name = mentorSeatDisplayName(option.value);

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(option.value)}
              className="flex flex-col rounded border px-6 py-6 text-left transition-colors"
              style={{
                background: isSelected
                  ? "var(--sc-accent-pale)"
                  : "var(--sc-panel)",
                borderColor: isSelected ? "var(--sc-accent)" : "var(--sc-rule)",
                cursor: "pointer",
              }}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ ...uiFont, color: "var(--sc-accent)" }}
                >
                  {name}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-4 w-4 shrink-0 rounded-full border"
                  style={{
                    borderColor: isSelected
                      ? "var(--sc-accent)"
                      : "var(--sc-rule)",
                    background: isSelected ? "var(--sc-accent)" : "transparent",
                    boxShadow: isSelected
                      ? "inset 0 0 0 2px var(--sc-panel)"
                      : "none",
                  }}
                />
              </span>

              <span
                className="mt-4 block text-[22px] font-semibold leading-tight tracking-tight"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {option.price}
              </span>

              <span
                className="mt-3 block text-[15px] leading-relaxed"
                style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
              >
                {option.audience}
              </span>
              <span
                className="mt-3 block text-[14px] leading-relaxed"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                {option.detail}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-6">
        {selected ? (
          <Link
            href={buildMentorSeatCheckoutPath(selected)}
            className="inline-flex items-center justify-center rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline transition-opacity hover:opacity-90"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            Continue
          </Link>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center justify-center rounded border px-7 py-3.5 text-sm font-semibold tracking-wide opacity-40"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
            aria-disabled="true"
          >
            Continue
          </span>
        )}

        {showCancel && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-4 hover:underline"
            style={{ ...uiFont, color: "var(--sc-ink-soft)", cursor: "pointer" }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
