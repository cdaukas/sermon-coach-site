"use client";

import { useState } from "react";
import Link from "next/link";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { seatAvailability } from "@/components/mentor/seat-availability";
import { MentorSeatPurchaseOptions } from "@/components/mentor/MentorSeatPurchaseOptions";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/**
 * Seat counts, stated plainly. Billing is a footnote to the mentoring work
 * above it, so this stays quiet: no card, no shadow, one hairline rule.
 */
export function YourSeats({ capacity }: { capacity: MentorSeatCapacity }) {
  const [addingSeat, setAddingSeat] = useState(false);
  const rows = seatAvailability(capacity);

  return (
    <section aria-labelledby="your-seats-heading">
      <h2
        id="your-seats-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Your seats
      </h2>

      <div className="mt-4 max-w-md">
        {rows.map((row) => (
          <div
            key={row.seatType}
            className="flex flex-wrap items-baseline justify-between gap-3 border-b py-3 last:border-b-0"
            style={{ borderColor: "var(--sc-rule)" }}
          >
            <p
              className="text-[16px] font-semibold leading-snug tracking-tight"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {mentorSeatDisplayName(row.seatType)}
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              {row.used} in use
              <span aria-hidden="true"> · </span>
              <span
                style={{
                  color:
                    row.available > 0
                      ? "var(--sc-accent)"
                      : "var(--sc-ink-soft)",
                  fontWeight: row.available > 0 ? 600 : 400,
                }}
              >
                {row.available === 0
                  ? "0 more available"
                  : `${row.available} available`}
              </span>
            </p>
          </div>
        ))}
      </div>

      <p
        className="mt-6 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Seats renew monthly.{" "}
        <Link
          href="/dashboard/buy"
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--sc-ink-soft)" }}
        >
          Manage billing
        </Link>
        <span aria-hidden="true"> · </span>
        <button
          type="button"
          onClick={() => setAddingSeat((open) => !open)}
          aria-expanded={addingSeat}
          className="border-0 bg-transparent p-0 font-medium underline-offset-4 hover:underline"
          style={{
            ...uiFont,
            color: "var(--sc-ink-soft)",
            cursor: "pointer",
          }}
        >
          Add a seat
        </button>
      </p>

      {addingSeat ? (
        <div className="mt-8">
          <MentorSeatPurchaseOptions />
        </div>
      ) : null}
    </section>
  );
}
