"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { ActionArrow, goldActionStyle } from "@/components/dashboard/BillingCard";
import { buildCheckoutPath, type CoachCadence } from "@/lib/billing/checkout";
import {
  COACH_CADENCE_OPTIONS,
  DEFAULT_COACH_CADENCE,
  coachCadenceOption,
} from "@/lib/billing/plan-summary";

const uiFont = { fontFamily: "var(--font-ui)" };

const CADENCE_ORDER: CoachCadence[] = COACH_CADENCE_OPTIONS.map(
  (option) => option.cadence,
);

/**
 * The Coach offer for an account with no plan. Annual is selected on load, as
 * on pricing.html, so the cadence a preacher chose there is the one he sees
 * here. The Start Coach link is inside this component because its href is the
 * selected cadence; splitting them would need the whole card to be a client
 * component.
 */
export function StartCoachOffer() {
  const [cadence, setCadence] = useState<CoachCadence>(DEFAULT_COACH_CADENCE);
  const selected = coachCadenceOption(cadence);

  function onCadenceKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const index = CADENCE_ORDER.indexOf(cadence);
    const next =
      CADENCE_ORDER[(index + delta + CADENCE_ORDER.length) % CADENCE_ORDER.length];
    setCadence(next);
    const group = event.currentTarget.parentElement;
    const buttons = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[CADENCE_ORDER.indexOf(next)]?.focus();
  }

  return (
    <div className="dashboard-coach-offer">
      <div
        className="dashboard-cadence-control"
        role="radiogroup"
        aria-label="Billing cadence"
      >
        {COACH_CADENCE_OPTIONS.map((option) => {
          const checked = option.cadence === cadence;
          return (
            <button
              key={option.cadence}
              type="button"
              className="dashboard-cadence-option"
              role="radio"
              aria-checked={checked}
              onClick={() => setCadence(option.cadence)}
              onKeyDown={onCadenceKeyDown}
              style={uiFont}
            >
              {option.label}
              {option.badge ? (
                <span className="dashboard-cadence-badge">{option.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="dashboard-coach-price" style={uiFont}>
        <span className="dashboard-coach-currency">$</span>
        {selected.price}
        <span className="dashboard-coach-period">{selected.period}</span>
      </p>

      <p className="dashboard-coach-note" style={uiFont} aria-live="polite">
        {selected.note}
      </p>

      <Link
        href={buildCheckoutPath(cadence)}
        className="no-underline hover:underline"
        style={goldActionStyle}
      >
        Start Coach
        <ActionArrow />
      </Link>
    </div>
  );
}
