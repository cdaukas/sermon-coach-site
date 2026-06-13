import { GrowthTrendCard } from "@/components/dashboard/GrowthTrendCard";
import { DashboardSubscribeCTA } from "@/components/dashboard/DashboardSubscribeCTA";
import { PackCreditsCard } from "@/components/dashboard/PackCreditsCard";
import { SermonList } from "@/components/dashboard/SermonList";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { getPackCredits } from "@/lib/billing/pack-credits";
import { getSubscriptionStatus } from "@/lib/billing/subscription-status";
import { toGrowthTrendPoints } from "@/lib/evaluation/growth-trend";
import { listCompletedEvaluationsTrend } from "@/lib/evaluation/queries";
import {
  getSubscriptionStatus as getEvalSubscriptionStatus,
  isSubscriptionActive,
} from "@/lib/evaluation/subscription";
import { listSermons } from "@/lib/sermons/queries";
import { createClient } from "@/lib/supabase/server";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sermons, subscriptionStatus, packCredits, completedEvaluations, evalSubStatus] =
    await Promise.all([
      listSermons(),
      getSubscriptionStatus(),
      getPackCredits(),
      listCompletedEvaluationsTrend(),
      user ? getEvalSubscriptionStatus(user.id) : Promise.resolve(null),
    ]);
  const growthTrendPoints = toGrowthTrendPoints(completedEvaluations);
  const hasActiveSubscription = isSubscriptionActive(evalSubStatus);
  const showSubscribeCTA = !hasActiveSubscription;
  const showStatusRow = subscriptionStatus || packCredits || showSubscribeCTA;

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
          Dashboard
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Your sermons
        </h1>
      </div>

      <GrowthTrendCard points={growthTrendPoints} />

      {showStatusRow ? (
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-stretch">
          {subscriptionStatus ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <SubscriptionStatusCard status={subscriptionStatus} />
            </div>
          ) : null}

          {showSubscribeCTA ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <DashboardSubscribeCTA />
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

      <SermonList sermons={sermons} />
    </main>
  );
}
