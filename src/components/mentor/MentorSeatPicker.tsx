"use client";

import { useState } from "react";
import Link from "next/link";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const UPGRADE_LINE =
  "You can move someone from Apprentice to Colleague later. Moving up releases everything being held.";

type SeatOption = {
  value: MentorSeatType;
  audience: string;
  cadence: string;
  detail: string;
  price: string;
};

export const SEAT_OPTIONS: SeatOption[] = [
  {
    value: "debrief",
    audience: "For developing preachers",
    cadence: "2 sermons / month",
    detail: "You receive the coaching debrief and How It Preaches.",
    price: "$12/month",
  },
  {
    value: "evaluation",
    audience: "For experienced preachers",
    cadence: "4 sermons / month",
    detail: "You receive the full evaluation and score.",
    price: "$25/month",
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
        className="grid gap-5 sm:grid-cols-2"
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
              className="flex flex-col rounded px-6 py-7 text-left transition-colors sm:px-8 sm:py-8"
              style={{
                background: isSelected
                  ? "var(--sc-accent-pale)"
                  : "var(--sc-panel)",
                border: isSelected
                  ? "1px solid var(--sc-accent)"
                  : "1px solid var(--sc-rule)",
                cursor: "pointer",
              }}
            >
              <span className="flex items-center justify-between gap-3">
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
                className="mt-2 block text-[15px] leading-relaxed"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                {option.audience}
              </span>

              <span
                className="mt-6 block text-[26px] font-semibold leading-tight tracking-tight"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {option.cadence}
              </span>
              <span
                className="mt-3 mb-6 block max-w-sm text-[15px] leading-relaxed"
                style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
              >
                {option.detail}
              </span>

              <span
                className="mt-auto block border-t pt-5"
                style={{ borderColor: "var(--sc-rule)" }}
              >
                <span
                  className="text-[17px] font-semibold tracking-tight"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  {option.price}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="mt-5 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {UPGRADE_LINE}
      </p>

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
