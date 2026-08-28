"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";
import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function SeatRow({
  seatType,
  used,
  held,
}: {
  seatType: MentorSeatType;
  used: number;
  held: number;
}) {
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-3 border-b py-3 last:border-b-0"
      style={{ borderColor: "var(--sc-rule)" }}
    >
      <p
        className="text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        <span className="font-semibold">
          {mentorSeatDisplayName(seatType)}
        </span>
        <span aria-hidden="true"> · </span>
        {used} of {held} seat{held === 1 ? "" : "s"} in use
      </p>
      <Link
        href={buildMentorSeatCheckoutPath(seatType)}
        className="text-[13px] font-semibold underline-offset-4 hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        {held === 0 ? "Add seats" : "Add another"}
      </Link>
    </div>
  );
}

/**
 * Seat counts and purchase links, deliberately subordinate to the mentoring
 * work above. Same checkout paths as before; only the prominence changed.
 */
export function SeatsAndBilling({
  capacity,
  children,
}: {
  capacity: MentorSeatCapacity;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const totalHeld = capacity.debrief.capacity + capacity.evaluation.capacity;

  return (
    <section aria-labelledby="seats-billing-heading">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="border-0 bg-transparent p-0 text-[14px] font-medium underline-offset-4 hover:underline"
        style={{ ...uiFont, color: "var(--sc-ink-soft)", cursor: "pointer" }}
      >
        <span id="seats-billing-heading">Manage seats &amp; billing</span>{" "}
        <span aria-hidden="true">{open ? "↑" : "→"}</span>
      </button>

      {open ? (
        <div
          className="mt-5 rounded px-6 py-6"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
          }}
        >
          <h3
            className="text-[17px] font-semibold leading-snug tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Your seats
          </h3>

          <div className="mt-3">
            <SeatRow
              seatType="debrief"
              used={capacity.debrief.used}
              held={capacity.debrief.capacity}
            />
            <SeatRow
              seatType="evaluation"
              used={capacity.evaluation.used}
              held={capacity.evaluation.capacity}
            />
          </div>

          {totalHeld === 0 ? (
            <p
              className="mt-4 text-[13px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Purchase seats to invite preachers. Complimentary and paid seats
              show as one held number.
            </p>
          ) : null}

          {children}
        </div>
      ) : null}
    </section>
  );
}
