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
  const showSubscribeHeadline = !onBuySurface || !hasActiveSubscription;
  const showPackSubhead = !onBuySurface || !hasActiveSubscription;

  return (
    <div
      className="h-full rounded px-6 py-5"
      style={{
        background: "var(--sc-accent-pale)",
        border: "1px solid var(--sc-rule)",
        borderLeft: "3px solid var(--sc-accent)",
      }}
    >
      {showSubscribeHeadline ? (
        <p
          className="mb-4 text-[15px] font-medium"
          style={{ ...uiFont, color: "var(--sc-ink)" }}
        >
          {hasActiveSubscription
            ? "Need extra evaluations?"
            : "Preaching more often? Subscribe."}
        </p>
      ) : null}

      {!hasActiveSubscription ? (
        <div className="flex flex-col gap-2">
          <Link
            href={buildCheckoutPath("monthly")}
            className={primaryButtonClass}
            style={primaryButtonStyle}
          >
            Subscribe monthly · $29/mo
          </Link>

          <Link
            href={buildCheckoutPath("annual")}
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
          >
            Subscribe annually · $290/yr
          </Link>
          <p
            className="text-center text-[12px]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            2 months free
          </p>
        </div>
      ) : null}

      {!hasActiveSubscription ? (
        <div
          className="my-5 border-t"
          style={{ borderColor: "var(--sc-rule)" }}
          aria-hidden
        />
      ) : null}

      {showPackSubhead ? (
        <p
          className={`text-[13px] font-medium ${hasActiveSubscription ? "" : "mb-3"}`}
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Preach less often? Buy a pack instead.
        </p>
      ) : null}

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
    </div>
  );
}
