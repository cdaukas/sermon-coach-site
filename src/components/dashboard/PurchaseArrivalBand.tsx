"use client";

import { useEffect, useState } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };
const STORAGE_KEY = "sc-pack-arrival-dismissed";

type PurchaseArrivalBandProps = {
  packName: string;
  creditCount: number;
  grantKey: string;
};

export function PurchaseArrivalBand({
  packName,
  creditCount,
  grantKey,
}: PurchaseArrivalBandProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === grantKey) {
        setVisible(false);
        return;
      }
    } catch {
      // sessionStorage may be unavailable
    }
    setVisible(true);
  }, [grantKey]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="mb-5 flex flex-wrap items-center justify-between gap-3"
      role="status"
      style={{
        background: "#faf6ed",
        border: "1px solid #e8dcc2",
        borderRadius: 4,
        padding: "12px 16px",
      }}
    >
      <p className="m-0" style={{ ...uiFont, fontSize: 13, color: "#1a2332" }}>
        {packName} added. {creditCount} more credits, good for 18 months.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, grantKey);
          } catch {
            // ignore
          }
          setVisible(false);
        }}
        className="shrink-0"
        style={{
          ...uiFont,
          fontSize: 12,
          fontWeight: 600,
          color: "#a67c2e",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
