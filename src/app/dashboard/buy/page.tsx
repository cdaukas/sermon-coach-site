import type { Metadata } from "next";
import { BuyPackCards } from "@/components/dashboard/BuyPackCards";
import { CreditStrip } from "@/components/dashboard/CreditStrip";
import {
  DevelopingOthersCard,
  PlanCard,
} from "@/components/dashboard/PlanCard";
import { getPackCredits } from "@/lib/billing/pack-credits";
import {
  developingOthersCopy,
  resolvePlanCopy,
} from "@/lib/billing/plan-summary";
import { buildCreditStripModel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { listMentorSeatsForMentor } from "@/lib/mentor/list-seats";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function BuyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entitlement = user
    ? await getEvaluationEntitlement(user.id)
    : null;

  const hasActiveSubscription = entitlement?.subscriptionActive === true;
  const stripModel = buildCreditStripModel(entitlement);
  const usage = entitlement?.usage ?? null;
  const subscriberDepleted =
    hasActiveSubscription && usage !== null && usage.used >= usage.limit;

  let isComped = false;
  let discountNote: string | null = null;
  let subscriptionInterval: string | null = null;
  let currentPeriodEnd: string | null = null;
  let subscriptionStatus: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "stripe_customer_id, plan_tier, subscription_interval, is_comped, discount_note, current_period_end, subscription_status",
      )
      .eq("id", user.id)
      .maybeSingle();

    isComped = profile?.is_comped === true;
    if (typeof profile?.discount_note === "string") {
      const trimmed = profile.discount_note.trim();
      discountNote = trimmed.length > 0 ? trimmed : null;
    }
    subscriptionInterval =
      typeof profile?.subscription_interval === "string"
        ? profile.subscription_interval
        : null;
    currentPeriodEnd =
      typeof profile?.current_period_end === "string"
        ? profile.current_period_end
        : profile?.current_period_end instanceof Date
          ? profile.current_period_end.toISOString()
          : null;
    subscriptionStatus =
      typeof profile?.subscription_status === "string"
        ? profile.subscription_status
        : null;
  }

  const packSummary = user ? await getPackCredits() : null;
  const packRemaining =
    entitlement?.packRemaining ?? packSummary?.totalRemaining ?? 0;
  const planCopy = user
    ? resolvePlanCopy(
        {
          isComped,
          subscriptionActive: subscriptionStatus === "active",
          discountNote,
          subscriptionInterval,
          currentPeriodEnd,
        },
        {
          remaining: packRemaining,
          expiryIso: packSummary?.soonestExpiry ?? null,
        },
      )
    : null;

  let developingOthers: string | null = null;
  if (user) {
    try {
      const seats = await listMentorSeatsForMentor();
      developingOthers = developingOthersCopy({
        activeSeatTypes: seats.active.map((row) => row.seatType),
        pendingSeatTypes: seats.pending.map((row) => row.seatType),
      });
    } catch {
      developingOthers = null;
    }
  }

  return (
    <main>
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Account
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Billing
        </h1>
      </div>

      {planCopy ? <PlanCard copy={planCopy} /> : null}

      {developingOthers ? (
        <DevelopingOthersCard text={developingOthers} />
      ) : null}

      {stripModel ? (
        <CreditStrip model={stripModel} showAddCreditsLink={false} variant="plain" />
      ) : null}

      {subscriberDepleted ? (
        <p
          className="mb-4 max-w-3xl text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          role="status"
        >
          Out of credits until next month? A pack carries you through. Credits stack on top of your subscription, get used only after your monthly ten, and stay good for 18 months. Nothing you buy goes to waste.
        </p>
      ) : null}

      <div className="max-w-3xl">
        <BuyPackCards />
      </div>
    </main>
  );
}
