import type { CSSProperties } from "react";

import type { SubscriptionStatus } from "@/lib/billing/subscription-status";

export function SubscriptionStatusCard({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const cardStyle: CSSProperties = {
    background: "var(--sc-accent-pale)",
    border: "1px solid var(--sc-accent-soft)",
    borderRadius: "4px",
    padding: "20px 24px",
    marginBottom: "24px",
    height: "100%",
  };

  const labelStyle: CSSProperties = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--sc-accent)",
    fontWeight: 600,
    marginBottom: "6px",
  };

  const primaryStyle: CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--sc-ink)",
  };

  const subStyle: CSSProperties = {
    fontSize: "14px",
    color: "var(--sc-ink-soft)",
    marginTop: "2px",
  };

  if (status.kind === "subscription") {
    const word = status.remaining === 1 ? "evaluation" : "evaluations";
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Subscription · This Month</div>
        <div style={primaryStyle}>
          {status.remaining} of {status.limit} {word} left
        </div>
        <div style={subStyle}>Resets at the start of your next billing cycle.</div>
      </div>
    );
  }

  // kind === "free"
  const word = status.freeRemaining === 1 ? "evaluation" : "evaluations";
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Free to try</div>
      <div style={primaryStyle}>
        {status.freeRemaining} free {word} available
      </div>
      <div style={subStyle}>Run a sermon to see the full evaluation.</div>
    </div>
  );
}
