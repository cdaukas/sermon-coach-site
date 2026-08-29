"use client";

import { useState } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };

export function ManageSubscriptionButton({
  label = "Manage subscription",
}: {
  label?: string;
}) {
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
    <span className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={openPortal}
        disabled={pending}
        className="cursor-pointer border-0 bg-transparent p-0 hover:underline disabled:cursor-wait disabled:no-underline disabled:opacity-70"
        style={{
          ...uiFont,
          fontSize: 13,
          fontWeight: 600,
          color: "#a67c2e",
        }}
      >
        {pending ? "Opening…" : label}
        {pending ? null : <span aria-hidden="true"> →</span>}
      </button>
      {error ? (
        <span
          role="status"
          style={{
            ...uiFont,
            fontSize: 12,
            fontWeight: 500,
            color: "#8b4a3a",
            maxWidth: 220,
            textAlign: "right",
          }}
        >
          {error}
        </span>
      ) : null}
    </span>
  );
}
