import type { CSSProperties } from "react";

import type { SubscriptionStatus } from "@/lib/billing/subscription-status";

export function SubscriptionStatusCard({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const cardStyle: CSSProperties = {
    background: "var(--sc-panel)",
    border: "1px solid var(--sc-rule)",
    borderRadius: "4px",
    padding: "12px 16px",
    height: "100%",
  };

  const labelStyle: CSSProperties = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--sc-ink-soft)",
    fontWeight: 600,
    marginBottom: "4px",
  };

  const primaryStyle: CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--sc-ink)",
    lineHeight: 1.3,
  };

  const accentNumberStyle: CSSProperties = {
    color: "var(--sc-accent)",
  };

  const subStyle: CSSProperties = {
    fontSize: "13px",
    color: "var(--sc-ink-soft)",
    marginTop: "2px",
    lineHeight: 1.4,
  };

  if (status.kind === "subscription") {
    const word = status.remaining === 1 ? "evaluation" : "evaluations";
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Subscription · This Month</div>
        <div style={primaryStyle}>
          <span style={accentNumberStyle}>{status.remaining}</span> of {status.limit}{" "}
          {word} left
        </div>
        <div style={subStyle}>Resets at the start of next month.</div>
      </div>
    );
  }

  // kind === "free"
  const word = status.freeRemaining === 1 ? "evaluation" : "evaluations";
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Free to try</div>
      <div style={primaryStyle}>
        <span style={accentNumberStyle}>{status.freeRemaining}</span> free {word}{" "}
        available
      </div>
      <div style={subStyle}>Run a sermon to see the full evaluation.</div>
    </div>
  );
}
