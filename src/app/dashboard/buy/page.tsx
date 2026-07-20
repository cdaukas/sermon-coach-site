import type { Metadata } from "next";
import { BuyPackCards } from "@/components/dashboard/BuyPackCards";
import { DashboardSubscribeCTA } from "@/components/dashboard/DashboardSubscribeCTA";
import { PackCreditsCard } from "@/components/dashboard/PackCreditsCard";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { getPackCredits } from "@/lib/billing/pack-credits";
import { getSubscriptionStatus } from "@/lib/billing/subscription-status";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import type { PlanTier } from "@/lib/evaluation/entitlement-types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Buy",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function planLabel(planTier: PlanTier | undefined): string {
  if (planTier === "cohort") {
    return "You're on Cohort";
  }

  if (planTier === "coach") {
    return "You're on Coach";
  }

  return "You're subscribed";
}

export default async function BuyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [entitlement, subscriptionStatus, packCredits] = await Promise.all([
    user ? getEvaluationEntitlement(user.id) : Promise.resolve(null),
    getSubscriptionStatus(),
    getPackCredits(),
  ]);

  const hasActiveSubscription = entitlement?.subscriptionActive === true;
  const showStatusRow = subscriptionStatus || packCredits;
  const usage = entitlement?.usage ?? null;
  const subscriberDepleted =
    hasActiveSubscription && usage !== null && usage.used >= usage.limit;

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Buy
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Add credits
        </h1>
        {hasActiveSubscription ? (
          <p
            className="mt-3 text-[14px]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {planLabel(entitlement?.usage?.planTier)}
          </p>
        ) : null}
      </div>

      {showStatusRow ? (
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-stretch">
          {subscriptionStatus ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <SubscriptionStatusCard status={subscriptionStatus} />
            </div>
          ) : null}

          {packCredits ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <PackCreditsCard
                totalRemaining={packCredits.totalRemaining}
                soonestExpiry={packCredits.soonestExpiry}
                hasActiveSubscription={hasActiveSubscription}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {!hasActiveSubscription ? (
        <div className="max-w-md">
          <DashboardSubscribeCTA
            hasActiveSubscription={hasActiveSubscription}
            surface="buy"
          />
        </div>
      ) : null}

      {subscriberDepleted ? (
        <p
          className="mt-6 max-w-3xl text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          role="status"
        >
          Out of credits until next month? A pack carries you through. Credits stack on top of your subscription, get used only after your monthly ten, and stay good for 18 months. Nothing you buy goes to waste.
        </p>
      ) : null}

      <div className="mt-6 max-w-3xl">
        <BuyPackCards />
      </div>
    </main>
  );
}
