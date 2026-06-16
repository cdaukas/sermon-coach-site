import Link from "next/link";
import { DashboardSubscribeCTA } from "@/components/dashboard/DashboardSubscribeCTA";
import { PackCreditsCard } from "@/components/dashboard/PackCreditsCard";
import { SermonList } from "@/components/dashboard/SermonList";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { getPackCredits } from "@/lib/billing/pack-credits";
import { getSubscriptionStatus } from "@/lib/billing/subscription-status";
import { listRecentCompleteEvaluations } from "@/lib/evaluation/queries";
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

  const [sermons, subscriptionStatus, packCredits, evalSubStatus, recentComplete] =
    await Promise.all([
      listSermons(),
      getSubscriptionStatus(),
      getPackCredits(),
      user ? getEvalSubscriptionStatus(user.id) : Promise.resolve(null),
      listRecentCompleteEvaluations(2),
    ]);
  const hasActiveSubscription = isSubscriptionActive(evalSubStatus);
  const showPurchaseCard = true;
  const showStatusRow = subscriptionStatus || packCredits || showPurchaseCard;
  const growthReportHref = recentComplete.length >= 2 ? "/dashboard/growth" : null;

  const pageHeader = (
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
  );

  const growthReportLink = growthReportHref ? (
    <Link
      href={growthReportHref}
      className="inline-block shrink-0 rounded border px-5 py-3 text-[13px] font-semibold tracking-wide no-underline transition-colors hover:border-[var(--sc-accent)]"
      style={{
        ...uiFont,
        background: "var(--sc-bg)",
        borderColor: "var(--sc-rule)",
        color: "var(--sc-ink)",
      }}
    >
      View growth report →
    </Link>
  ) : null;

  function renderToolbar(searchInput?: React.ReactNode) {
    if (!growthReportLink && !searchInput) {
      return null;
    }

    return (
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {growthReportLink}
        {searchInput ? <div className="min-w-0 flex-1">{searchInput}</div> : null}
      </div>
    );
  }

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      {showStatusRow ? (
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-stretch">
          {subscriptionStatus ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <SubscriptionStatusCard status={subscriptionStatus} />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
            <DashboardSubscribeCTA hasActiveSubscription={hasActiveSubscription} />
          </div>

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

      {sermons.length === 0 ? (
        <>
          {renderToolbar()}
          {pageHeader}
          <SermonList sermons={sermons} />
        </>
      ) : (
        <SermonList
          sermons={sermons}
          leadingContent={(searchInput) => (
            <>
              {renderToolbar(searchInput)}
              {pageHeader}
            </>
          )}
        />
      )}
    </main>
  );
}
