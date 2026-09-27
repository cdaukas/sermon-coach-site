import Link from "next/link";
import { ManageSubscriptionButton } from "@/components/dashboard/ManageSubscriptionButton";
import {
  ActionArrow,
  BillingCard,
  CoachCardIcon,
  MentoringCardIcon,
  goldActionStyle,
} from "@/components/dashboard/BillingCard";
import { StartCoachOffer } from "@/components/dashboard/StartCoachOffer";
import {
  MENTOR_SEAT_MONTHLY_USD,
  type MentorSeatBreakdown,
  type PlanCopy,
} from "@/lib/billing/plan-summary";
import {
  SEAT_BILLING_PORTAL_LABEL,
  SEAT_END_RELEASE_NOTICE,
} from "@/lib/mentor/seat-end-notice";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function PlanActions({
  actions,
  showSwitchToAnnual,
}: {
  actions: PlanCopy["actions"];
  showSwitchToAnnual: boolean;
}) {
  if (actions === "none") {
    return null;
  }
  // The Start Coach link travels with the cadence toggle in the card footer,
  // because its href is whichever cadence is selected.
  if (actions === "start_coach") {
    return null;
  }
  if (actions === "annual_and_manage" && showSwitchToAnnual) {
    return (
      <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
        <ManageSubscriptionButton label="Switch to annual" intent="switch_to_annual" />
        <span style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}>·</span>
        <ManageSubscriptionButton />
      </span>
    );
  }
  return <ManageSubscriptionButton />;
}

export function PlanCard({
  copy,
  seatEndNotice = false,
  showSwitchToAnnual = true,
}: {
  copy: PlanCopy;
  /** Next to Manage subscription, which opens the portal where a seat is cancelled. */
  seatEndNotice?: boolean;
  /** Hidden when Stripe has no subscription on the Coach monthly price. */
  showSwitchToAnnual?: boolean;
}) {
  return (
    <BillingCard
      aria-label="Current plan"
      icon={<CoachCardIcon />}
      action={
        <PlanActions
          actions={copy.actions}
          showSwitchToAnnual={showSwitchToAnnual}
        />
      }
      footer={copy.actions === "start_coach" ? <StartCoachOffer /> : null}
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
        {seatEndNotice ? (
          <p
            className="mt-3 mb-0"
            style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
          >
            {SEAT_END_RELEASE_NOTICE}
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

export function SeatBillingPortalBlock() {
  return (
    <BillingCard
      aria-label="Manage seats and billing"
      icon={<MentoringCardIcon />}
    >
      <div className="min-w-0">
        <ManageSubscriptionButton
          label={SEAT_BILLING_PORTAL_LABEL}
          intent="manage_seats"
        />
        <p
          className="mt-2 mb-0 max-w-md leading-relaxed"
          style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
        >
          {SEAT_END_RELEASE_NOTICE}
        </p>
      </div>
    </BillingCard>
  );
}

export function DevelopingOthersCard({
  text,
  breakdown,
  showSeatBillingPortal = false,
}: {
  text: string;
  breakdown: MentorSeatBreakdown;
  showSeatBillingPortal?: boolean;
}) {
  return (
    <BillingCard
      aria-label="Developing others"
      icon={<MentoringCardIcon />}
      action={
        <div className="flex flex-wrap items-start justify-end gap-x-3 gap-y-2">
          {showSeatBillingPortal ? (
            <div className="flex max-w-xs flex-col items-end gap-2">
              <ManageSubscriptionButton
                label={SEAT_BILLING_PORTAL_LABEL}
                intent="manage_seats"
              />
              <p
                className="m-0 text-right leading-relaxed"
                style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
              >
                {SEAT_END_RELEASE_NOTICE}
              </p>
            </div>
          ) : null}
          <Link
            href="/dashboard/develop"
            className="shrink-0 no-underline hover:underline"
            style={goldActionStyle}
          >
            Manage seats
            <ActionArrow />
          </Link>
        </div>
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
