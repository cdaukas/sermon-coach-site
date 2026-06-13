import Link from "next/link";

import { buildCheckoutPath } from "@/lib/billing/checkout";

const uiFont = { fontFamily: "var(--font-ui)" };

const primaryButtonClass =
  "block w-full rounded border px-4 py-2.5 text-center text-[13px] font-semibold tracking-wide no-underline transition-all sm:w-auto";

const primaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
} as const;

const secondaryButtonClass =
  "block w-full rounded border px-4 py-2.5 text-center text-[13px] font-medium no-underline transition-colors hover:border-[var(--sc-ink)] sm:w-auto";

const secondaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
} as const;

export function DashboardSubscribeCTA() {
  return (
    <div
      className="h-full rounded px-6 py-5"
      style={{
        background: "var(--sc-accent-pale)",
        border: "1px solid var(--sc-rule)",
        borderLeft: "3px solid var(--sc-accent)",
      }}
    >
      <p
        className="mb-4 text-[15px] font-medium"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        Already know you want it?
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <Link
          href={buildCheckoutPath("monthly")}
          className={primaryButtonClass}
          style={primaryButtonStyle}
        >
          Subscribe monthly · $29/mo
        </Link>

        <div className="flex flex-col items-stretch gap-1 sm:items-start">
          <Link
            href={buildCheckoutPath("annual")}
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
          >
            Subscribe annually · $290/yr
          </Link>
          <p
            className="text-center text-[12px] sm:text-left"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            2 months free
          </p>
        </div>
      </div>
    </div>
  );
}
