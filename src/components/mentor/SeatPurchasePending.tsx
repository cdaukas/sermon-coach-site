"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  mentorSeatCapacityIsPositive,
  parseMentorSeatCapacityPayload,
} from "@/lib/mentor/capacity-parse";
import { createClient } from "@/lib/supabase/client";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/** Same cadence as useEvaluationPolling. */
const POLL_MS = 3000;
/** Webhooks land in seconds. Do not reuse the 5-minute eval ceiling. */
const POLL_CEILING_MS = 60 * 1000;

export function SeatPurchasePending() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (timedOut) return;

    let cancelled = false;

    async function tick() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_mentor_seat_capacity");
      if (cancelled || error) return;
      const capacity = parseMentorSeatCapacityPayload(data);
      if (capacity && mentorSeatCapacityIsPositive(capacity)) {
        router.refresh();
      }
    }

    void tick();
    const poll = setInterval(() => {
      void tick();
    }, POLL_MS);
    const ceiling = setTimeout(() => {
      clearInterval(poll);
      setTimedOut(true);
    }, POLL_CEILING_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(ceiling);
    };
  }, [timedOut, router]);

  if (timedOut) {
    return (
      <div
        role="alert"
        className="rounded px-7 py-6"
        style={{
          background: "#ffffff",
          boxShadow: "var(--sc-shadow)",
          borderRadius: 4,
          borderLeft: "3px solid #a04848",
        }}
      >
        <h2
          className="text-[25px] font-semibold leading-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Your payment went through, but the seat has not appeared yet
        </h2>
        <p
          className="mt-3 max-w-md text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Refresh in a minute, or reply to your receipt and we will sort it
          out.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="mt-6 inline-flex rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide"
          style={{
            ...uiFont,
            background: "var(--sc-ink)",
            color: "var(--sc-bg)",
            borderColor: "var(--sc-ink)",
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded px-7 py-6"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        borderRadius: 4,
      }}
    >
      <h2
        className="text-[25px] font-semibold leading-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Payment received. Setting up your seat.
      </h2>
    </div>
  );
}
