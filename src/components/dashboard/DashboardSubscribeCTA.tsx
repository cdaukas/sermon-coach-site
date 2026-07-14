import Link from "next/link";

import {
  buildCheckoutPath,
  buildPackCheckoutPath,
  type PackSku,
} from "@/lib/billing/checkout";

const uiFont = { fontFamily: "var(--font-ui)" };

const primaryButtonClass =
  "block w-full rounded border px-4 py-2.5 text-center text-[13px] font-semibold tracking-wide no-underline transition-all";

const primaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
} as const;

const secondaryButtonClass =
  "block w-full rounded border px-4 py-2.5 text-center text-[13px] font-medium no-underline transition-colors hover:border-[var(--sc-ink)]";

const secondaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
} as const;

const packButtonClass =
  "block w-full rounded border px-3 py-1.5 text-center text-[12px] font-medium no-underline transition-colors hover:border-[var(--sc-ink)]";

const packButtonStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
} as const;

const PACK_OFFERS: { pack: PackSku; label: string }[] = [
  { pack: "pack_2", label: "Guest Preacher · 2 for $29" },
  { pack: "pack_6", label: "Pulpit Supply · 6 for $69" },
  { pack: "pack_12", label: "Series Prep · 12 for $109" },
];

type DashboardSubscribeCTAProps = {
  hasActiveSubscription: boolean;
  surface?: "dashboard" | "buy";
};

export function DashboardSubscribeCTA({
  hasActiveSubscription,
  surface = "dashboard",
}: DashboardSubscribeCTAProps) {
  const onBuySurface = surface === "buy";
  const showPackSubhead = !onBuySurface || !hasActiveSubscription;

  return (
    <div
      className="flex h-full flex-col rounded border px-5 pb-5"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
        paddingTop: "20px",
        boxShadow: "0 1px 3px rgba(26,35,50,.06), 0 1px 2px rgba(26,35,50,.04)",
      }}
    >
      <div
        className="sc-heading text-[18px] font-semibold"
        style={{ color: "var(--sc-ink)" }}
      >
        Coach
      </div>

      <p className="mt-2 text-[13px] italic" style={{ color: "var(--sc-ink-soft)" }}>
        For the pastor in the pulpit most weeks.
      </p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold" style={{ ...uiFont, color: "var(--sc-ink)" }}>
          $29
        </span>
        <span className="text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          /mo
        </span>
      </div>
      <div className="text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
        $290/yr · 2 months free
      </div>

      <ul className="mt-3 mb-4 flex-grow list-none space-y-2">
        {[
          "10 evaluations every month",
          "Full 11-criterion rubric",
          "A private library of every evaluation",
        ].map((line, i) => (
          <li key={i} className="relative pl-5 text-[13px]" style={{ color: "var(--sc-ink-mid)" }}>
            <span className="absolute left-0 font-bold" style={{ ...uiFont, color: "var(--sc-accent)" }}>
              {"\u2713"}
            </span>
            {line}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <Link href={buildCheckoutPath("monthly")} className={primaryButtonClass} style={primaryButtonStyle}>
          Subscribe monthly
        </Link>
        <Link href={buildCheckoutPath("annual")} className={secondaryButtonClass} style={secondaryButtonStyle}>
          Subscribe annually
        </Link>
      </div>

      {!onBuySurface && showPackSubhead ? (
        <p
          className={`text-[13px] font-medium ${hasActiveSubscription ? "" : "mb-3"}`}
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Preach less often? Buy a pack instead.
        </p>
      ) : null}

      {!onBuySurface ? (
        <div className={`flex flex-col gap-2 ${showPackSubhead ? "mt-3" : ""}`}>
          {PACK_OFFERS.map(({ pack, label }) => (
            <Link
              key={pack}
              href={buildPackCheckoutPath(pack)}
              className={packButtonClass}
              style={packButtonStyle}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
