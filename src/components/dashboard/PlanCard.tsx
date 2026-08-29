import Link from "next/link";
import { ManageSubscriptionButton } from "@/components/dashboard/ManageSubscriptionButton";
import {
  ActionArrow,
  BillingCard,
  CoachCardIcon,
  MentoringCardIcon,
  goldActionStyle,
} from "@/components/dashboard/BillingCard";
import { buildCheckoutPath } from "@/lib/billing/checkout";
import {
  MENTOR_SEAT_MONTHLY_USD,
  type MentorSeatBreakdown,
  type PlanCopy,
} from "@/lib/billing/plan-summary";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function StartCoachButton() {
  return (
    <Link
      href={buildCheckoutPath("monthly")}
      className="shrink-0 no-underline hover:underline"
      style={goldActionStyle}
    >
      Start Coach
      <ActionArrow />
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
    <BillingCard
      aria-label="Current plan"
      icon={<CoachCardIcon />}
      action={<PlanActions actions={copy.actions} />}
    >
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
    </BillingCard>
  );
}

const breakdownHeadStyle = {
  ...uiFont,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "#9aa1ac",
};

const breakdownValueStyle = {
  ...uiFont,
  fontSize: 13,
  color: "#4a5568",
  marginTop: 4,
};

function SeatBreakdownRow({
  breakdown,
}: {
  breakdown: MentorSeatBreakdown | null | undefined;
}) {
  if (!breakdown) {
    return null;
  }

  const rows = [
    breakdown.apprentice > 0
      ? {
          label: "Apprentice seats",
          count: breakdown.apprentice,
          cost: MENTOR_SEAT_MONTHLY_USD.debrief,
        }
      : null,
    breakdown.colleague > 0
      ? {
          label: "Colleague seats",
          count: breakdown.colleague,
          cost: MENTOR_SEAT_MONTHLY_USD.evaluation,
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  const mixed = rows.length > 1;

  return (
    <div
      className="mt-3 grid grid-cols-3 gap-3 pt-3"
      style={{ borderTop: "1px solid var(--sc-rule)" }}
    >
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const showTotal = !mixed || isLast;
        return (
          <div key={row.label} className="contents">
            <div>
              <div style={breakdownHeadStyle}>{row.label}</div>
              <div style={breakdownValueStyle}>{row.count}</div>
            </div>
            <div>
              <div style={breakdownHeadStyle}>Cost per seat</div>
              <div style={breakdownValueStyle}>${row.cost} / mo</div>
            </div>
            <div>
              <div style={breakdownHeadStyle}>
                {index === 0 ? "Monthly total" : "\u00a0"}
              </div>
              <div style={breakdownValueStyle}>
                {showTotal ? `$${breakdown.monthlyTotal} / mo` : "\u00a0"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DevelopingOthersCard({
  text,
  breakdown,
}: {
  text: string;
  breakdown: MentorSeatBreakdown;
}) {
  return (
    <BillingCard
      aria-label="Developing others"
      icon={<MentoringCardIcon />}
      action={
        <Link
          href="/dashboard/develop"
          className="shrink-0 no-underline hover:underline"
          style={goldActionStyle}
        >
          Manage seats
          <ActionArrow />
        </Link>
      }
      footer={<SeatBreakdownRow breakdown={breakdown} />}
    >
      <p
        className="m-0 min-w-0 leading-relaxed"
        style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
      >
        {text}
      </p>
    </BillingCard>
  );
}
