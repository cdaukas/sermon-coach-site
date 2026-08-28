import Link from "next/link";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import type { MentorSeatType } from "@/lib/mentor/relationships";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type Plan = {
  seatType: MentorSeatType;
  /** Indefinite article for the seat name, so the CTA reads correctly. */
  article: string;
  audience: string;
  cadence: string;
  detail: string;
  price: string;
};

const PLANS: Plan[] = [
  {
    seatType: "debrief",
    article: "an",
    audience: "For developing preachers",
    cadence: "2 sermons / month",
    detail: "You receive the coaching debrief and How It Preaches.",
    price: "$12/month",
  },
  {
    seatType: "evaluation",
    article: "a",
    audience: "For experienced preachers",
    cadence: "4 sermons / month",
    detail: "You receive the full evaluation and score.",
    price: "$25/month",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const name = mentorSeatDisplayName(plan.seatType);

  return (
    <div
      className="flex flex-col rounded px-6 py-7 sm:px-8 sm:py-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        {name}
      </p>
      <p
        className="mt-2 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {plan.audience}
      </p>

      <p
        className="mt-6 text-[26px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {plan.cadence}
      </p>
      <p
        className="mt-3 mb-6 max-w-sm text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {plan.detail}
      </p>

      <div
        className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t pt-5"
        style={{ borderColor: "var(--sc-rule)" }}
      >
        <p
          className="text-[17px] font-semibold tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {plan.price}
        </p>
        <Link
          href={buildMentorSeatCheckoutPath(plan.seatType)}
          className="text-[13px] font-semibold underline-offset-4 hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Add {plan.article} {name} seat
        </Link>
      </div>
    </div>
  );
}

export function MentoringPlans() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PLANS.map((plan) => (
        <PlanCard key={plan.seatType} plan={plan} />
      ))}
    </div>
  );
}
