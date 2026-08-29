import Link from "next/link";
import { ManageSubscriptionButton } from "@/components/dashboard/ManageSubscriptionButton";
import { buildCheckoutPath } from "@/lib/billing/checkout";
import type { PlanCopy } from "@/lib/billing/plan-summary";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #d4cfc1",
  borderLeft: "3px solid #c9a55c",
  borderRadius: 4,
  boxShadow: "var(--sc-shadow)",
  padding: "15px 20px",
} as const;

function StartCoachButton() {
  return (
    <Link
      href={buildCheckoutPath("monthly")}
      className="shrink-0 no-underline hover:underline"
      style={{ ...uiFont, fontSize: 13, fontWeight: 600, color: "#a67c2e" }}
    >
      Start Coach
    </Link>
  );
}

function PlanActions({ actions }: { actions: PlanCopy["actions"] }) {
  if (actions === "none") {
    return null;
  }
  if (actions === "start_coach") {
    return <StartCoachButton />;
  }
  if (actions === "annual_and_manage") {
    return (
      <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
        <ManageSubscriptionButton label="Switch to annual" />
        <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>·</span>
        <ManageSubscriptionButton />
      </span>
    );
  }
  return <ManageSubscriptionButton />;
}

export function PlanCard({ copy }: { copy: PlanCopy }) {
  return (
    <section className="mb-10" style={cardStyle} aria-label="Current plan">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 leading-relaxed">
          {copy.headline ? (
            <h2
              className="m-0"
              style={{
                ...serifFont,
                fontSize: 17,
                fontWeight: 600,
                color: "#1a2332",
              }}
            >
              {copy.headline}
            </h2>
          ) : null}
          <p
            className={copy.headline ? "mt-1 mb-0" : "m-0"}
            style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
          >
            {copy.detail}
          </p>
          {copy.nudge ? (
            <p
              className="mt-1 mb-0"
              style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
            >
              {copy.nudge}
            </p>
          ) : null}
        </div>
        <PlanActions actions={copy.actions} />
      </div>
    </section>
  );
}

export function DevelopingOthersCard({ text }: { text: string }) {
  return (
    <div>
      <p
        className="mb-2"
        style={{
          ...uiFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#9aa1ac",
        }}
      >
        Developing others
      </p>
      <section className="mb-4" style={cardStyle} aria-label="Developing others">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p
            className="m-0 min-w-0 leading-relaxed"
            style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
          >
            {text}
          </p>
          <Link
            href="/dashboard/develop"
            className="shrink-0 no-underline hover:underline"
            style={{ ...uiFont, fontSize: 13, fontWeight: 600, color: "#a67c2e" }}
          >
            Manage seats
          </Link>
        </div>
      </section>
    </div>
  );
}
