"use client";

import { useState } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export function AnnualUpgradePrompt() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        url?: unknown;
        error?: unknown;
      } | null;

      if (!response.ok) {
        const message =
          typeof payload?.error === "string" && payload.error.trim()
            ? payload.error
            : "Could not open subscription management.";
        setError(message);
        return;
      }

      const url = typeof payload?.url === "string" ? payload.url : "";
      if (!url) {
        setError("Could not open subscription management.");
        return;
      }

      window.location.assign(url);
    } catch {
      setError("Could not open subscription management.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="dashboard-annual-promo">
      <h2 className="dashboard-annual-promo-heading" style={serifFont}>
        Preaching regularly? Upgrade to annual and save.
      </h2>

      <p className="dashboard-annual-promo-body" style={uiFont}>
        Two months free. You pay $290 for the year instead of $348, and you stop thinking about the card until this time next year.
      </p>

      <p className="dashboard-annual-promo-body" style={uiFont}>
        Switch any time. If you switch mid-month, you&apos;ll see the exact amount before you confirm. Your ten evaluations a month stay the same.
      </p>

      <button
        type="button"
        onClick={openPortal}
        disabled={pending}
        className="dashboard-annual-promo-cta"
        style={uiFont}
      >
        {pending ? "Opening…" : "Switch to annual"}
      </button>

      {error ? (
        <p
          role="status"
          className="dashboard-annual-promo-error"
          style={uiFont}
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
