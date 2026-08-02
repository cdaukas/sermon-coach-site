import type { ReactNode } from "react";
import Link from "next/link";
import type { CreditStripModel } from "@/lib/billing/credit-display";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type CreditStripProps = {
  model: CreditStripModel;
};

export function CreditStrip({ model }: CreditStripProps) {
  const parts: ReactNode[] = [];

  if (model.subscription) {
    const { used, limit, resetLabel } = model.subscription;
    const remaining = Math.max(0, limit - used);
    parts.push(
      <span key="sub">
        <span
          style={{
            ...serifFont,
            fontSize: 17,
            fontWeight: 600,
            color: "#1a2332",
          }}
        >
          {remaining}
        </span>
        <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>
          {" "}
          of{" "}
        </span>
        <span
          style={{
            ...serifFont,
            fontSize: 17,
            fontWeight: 600,
            color: "#1a2332",
          }}
        >
          {limit}
        </span>
        <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>
          {" "}
          subscription credits, resets {resetLabel}
        </span>
      </span>,
    );
  }

  if (model.packRemaining > 0) {
    parts.push(
      <span key="pack">
        <span
          style={{
            ...serifFont,
            fontSize: 17,
            fontWeight: 600,
            color: "#1a2332",
          }}
        >
          {model.packRemaining}
        </span>
        <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>
          {" "}
          pack credits, used after those run out
        </span>
      </span>,
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3"
      style={{
        background: "#ffffff",
        border: "1px solid #d4cfc1",
        borderLeft: "3px solid #c9a55c",
        borderRadius: 4,
        boxShadow: "var(--sc-shadow)",
        padding: "15px 20px",
      }}
    >
      <p className="m-0 min-w-0 leading-relaxed">
        {parts.map((part, index) => (
          <span key={index}>
            {index > 0 ? (
              <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>
                {" "}
                ·{" "}
              </span>
            ) : null}
            {part}
          </span>
        ))}
      </p>
      <Link
        href="/dashboard/buy"
        className="shrink-0 no-underline hover:underline"
        style={{ ...uiFont, fontSize: 13, fontWeight: 600, color: "#a67c2e" }}
      >
        Add credits →
      </Link>
    </div>
  );
}
