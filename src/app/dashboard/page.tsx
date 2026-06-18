import Link from "next/link";
import { PackCreditsCard } from "@/components/dashboard/PackCreditsCard";
import { SermonList } from "@/components/dashboard/SermonList";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { getPackCredits } from "@/lib/billing/pack-credits";
import { getSubscriptionStatus } from "@/lib/billing/subscription-status";
import { listRecentCompleteEvaluations } from "@/lib/evaluation/queries";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { listSermons } from "@/lib/sermons/queries";
import { createClient } from "@/lib/supabase/server";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sermons, subscriptionStatus, packCredits, entitlement, recentComplete] =
    await Promise.all([
      listSermons(),
      getSubscriptionStatus(),
      getPackCredits(),
      user ? getEvaluationEntitlement(user.id) : Promise.resolve(null),
      listRecentCompleteEvaluations(2),
    ]);
  const hasActiveSubscription = entitlement?.subscriptionActive === true;
  const showStatusRow = subscriptionStatus || packCredits;
  const growthReportHref = recentComplete.length >= 2 ? "/dashboard/growth" : null;

  const pageHeader = (
    <div className="mt-12 mb-6">
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

          {packCredits ? (
            <div className="flex min-w-0 flex-1 flex-col [&>*]:h-full">
              <PackCreditsCard
                totalRemaining={packCredits.totalRemaining}
                soonestExpiry={packCredits.soonestExpiry}
                hasActiveSubscription={hasActiveSubscription}
              />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <Link
              href="/dashboard/buy"
              className="inline-block text-[13px] font-medium no-underline hover:underline"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              {hasActiveSubscription
                ? "Need more evaluations? Visit Buy →"
                : "Subscribe or buy a pack →"}
            </Link>
          </div>
        </div>
      ) : (
        <p className="mb-8">
          <Link
            href="/dashboard/buy"
            className="text-[13px] font-medium no-underline hover:underline"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            Subscribe or buy a pack →
          </Link>
        </p>
      )}

      <SermonList
        sermons={sermons}
        growthReportLink={growthReportLink}
        header={pageHeader}
      />
    </main>
  );
}
