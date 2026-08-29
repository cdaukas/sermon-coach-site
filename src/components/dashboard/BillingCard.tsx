import type { ReactNode } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };

/**
 * Self-contained card chrome. Applied as an inline style on the card element.
 * Must not be gated on an ancestor class.
 */
export const billingCardChrome = {
  background: "var(--sc-panel)",
  boxShadow: "var(--sc-shadow)",
  borderRadius: 4,
  padding: 32,
} as const;

export const goldActionStyle = {
  ...uiFont,
  fontSize: 13,
  fontWeight: 600,
  color: "#a67c2e",
} as const;

const iconSvgProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function BillingSectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-3"
      style={{
        ...uiFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#9aa1ac",
      }}
    >
      {children}
    </p>
  );
}

export function BillingSection({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-10">
      <BillingSectionEyebrow>{eyebrow}</BillingSectionEyebrow>
      {children}
    </div>
  );
}

export function BillingCardIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center"
      style={{
        borderRadius: "50%",
        background: "var(--sc-cream-tint)",
        color: "var(--sc-accent)",
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function CoachCardIcon() {
  return (
    <svg {...iconSvgProps}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function EvaluationsCardIcon() {
  return (
    <svg {...iconSvgProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

export function MentoringCardIcon() {
  return (
    <svg {...iconSvgProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ActionArrow() {
  return <span aria-hidden="true"> →</span>;
}

export function BillingCard({
  icon,
  action,
  children,
  footer,
  "aria-label": ariaLabel,
}: {
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  "aria-label": string;
}) {
  return (
    <section style={billingCardChrome} aria-label={ariaLabel}>
      <div className="flex items-start gap-4">
        <BillingCardIcon>{icon}</BillingCardIcon>
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      {footer ? (
        <div className="flex items-start gap-4">
          <span className="h-12 w-12 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">{footer}</div>
        </div>
      ) : null}
    </section>
  );
}
