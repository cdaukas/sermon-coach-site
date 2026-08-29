"use client";

import {
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  BillingCard,
  EvaluationsCardIcon,
  goldActionStyle,
} from "@/components/dashboard/BillingCard";
import type { CreditStripModel } from "@/lib/billing/credit-display";

const serifFont = { fontFamily: "var(--font-serif)" };
const uiFont = { fontFamily: "var(--font-ui)" };

const numeralStyle = {
  ...serifFont,
  fontSize: 32,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
  color: "var(--sc-ink)",
} as const;

const labelStyle = {
  ...uiFont,
  marginTop: 4,
  fontSize: 12,
  fontWeight: 500,
  color: "var(--sc-ink-soft)",
} as const;

const supportStyle = {
  ...uiFont,
  marginTop: 4,
  fontSize: 13,
  color: "var(--sc-ink-soft)",
} as const;

const halfStyle: CSSProperties = {
  flex: "1 1 0px",
  minWidth: 0,
};

function subscribeMax859(onChange: () => void) {
  const mq = window.matchMedia("(max-width: 859px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useStackEvalSplit() {
  return useSyncExternalStore(
    subscribeMax859,
    () => window.matchMedia("(max-width: 859px)").matches,
    () => false,
  );
}

type SermonEvaluationsCardProps = {
  model: CreditStripModel | null;
  defaultOpen: boolean;
  children: ReactNode;
};

function SubscriptionHalf({
  subscription,
  freeRemaining,
}: {
  subscription: NonNullable<CreditStripModel["subscription"]>;
  freeRemaining: number;
}) {
  const remaining = Math.max(0, subscription.limit - subscription.used);
  return (
    <div className="billing-eval-half" style={halfStyle}>
      <div style={numeralStyle}>{remaining}</div>
      <div style={labelStyle}>of {subscription.limit} subscription credits</div>
      <div style={supportStyle}>resets {subscription.resetLabel}</div>
      {freeRemaining > 0 ? (
        <div style={supportStyle}>
          {freeRemaining} free {freeRemaining === 1 ? "credit" : "credits"}
        </div>
      ) : null}
    </div>
  );
}

function FreeHalf({ remaining }: { remaining: number }) {
  return (
    <div className="billing-eval-half" style={halfStyle}>
      <div style={numeralStyle}>{remaining}</div>
      <div style={labelStyle}>
        free {remaining === 1 ? "credit" : "credits"}
      </div>
    </div>
  );
}

function PackHalf({
  remaining,
  stacked,
}: {
  remaining: number;
  stacked: boolean;
}) {
  return (
    <div
      className="billing-eval-half"
      style={{
        ...halfStyle,
        borderLeft: stacked ? "none" : "1px solid var(--sc-rule)",
        paddingLeft: stacked ? 0 : 32,
      }}
    >
      <div style={numeralStyle}>{remaining}</div>
      <div style={labelStyle}>pack credits</div>
      <div style={supportStyle}>used after those run out</div>
    </div>
  );
}

export function SermonEvaluationsCard({
  model,
  defaultOpen,
  children,
}: SermonEvaluationsCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const stacked = useStackEvalSplit();

  const subscription = model?.subscription ?? null;
  const packRemaining = model?.packRemaining ?? 0;
  const freeRemaining = model?.freeRemaining ?? 0;

  const addCreditsButton = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      onClick={() => setOpen((current) => !current)}
      className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0 no-underline hover:underline"
      style={goldActionStyle}
    >
      Add credits
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          marginLeft: 4,
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 150ms ease",
        }}
      >
        ▸
      </span>
    </button>
  );

  const left =
    subscription !== null ? (
      <SubscriptionHalf
        subscription={subscription}
        freeRemaining={freeRemaining}
      />
    ) : freeRemaining > 0 ? (
      <FreeHalf remaining={freeRemaining} />
    ) : null;

  return (
    <>
      <BillingCard
        aria-label="Sermon evaluations"
        icon={<EvaluationsCardIcon />}
        action={addCreditsButton}
      >
        <div
          className="billing-eval-split"
          style={{
            display: "flex",
            flexDirection: stacked ? "column" : "row",
            alignItems: "flex-start",
            gap: stacked ? 24 : 32,
            width: "100%",
            minWidth: 0,
          }}
        >
          {left}
          <PackHalf remaining={packRemaining} stacked={stacked} />
        </div>
      </BillingCard>
      {open ? (
        <div id={panelId} className="mt-4">
          {children}
        </div>
      ) : null}
    </>
  );
}
