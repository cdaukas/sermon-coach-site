"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };

/** Page view. Same shape as "mentoring page viewed". */
export const GROWTH_LOCKED_VIEW_EVENT = "growth locked view";

/** Checkout click. Same shape as "nav_mentoring_click". */
export const GROWTH_LOCKED_CLICK_EVENT = "growth_locked_click";

const CHECKOUT_HREF =
  "/checkout?plan=coach&cadence=monthly&source=growth-locked";

export function GrowthLockedView() {
  useEffect(() => {
    track(GROWTH_LOCKED_VIEW_EVENT);
  }, []);

  return null;
}

export function GrowthLockedCheckoutButton() {
  return (
    <a
      href={CHECKOUT_HREF}
      onClick={() => {
        track(GROWTH_LOCKED_CLICK_EVENT);
      }}
      style={{
        ...uiFont,
        display: "inline-block",
        marginTop: 28,
        fontSize: 13,
        fontWeight: 600,
        background: "#1a2332",
        color: "#faf8f3",
        borderRadius: 4,
        padding: "10px 18px",
        textDecoration: "none",
        lineHeight: 1.2,
      }}
    >
      Continue with Coach
    </a>
  );
}
