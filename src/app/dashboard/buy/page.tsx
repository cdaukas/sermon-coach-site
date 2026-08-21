import type { Metadata } from "next";
import { AnnualUpgradePrompt } from "@/components/dashboard/AnnualUpgradePrompt";
import { BuyPackCards } from "@/components/dashboard/BuyPackCards";
import { CreditStrip } from "@/components/dashboard/CreditStrip";
import { DashboardSubscribeCTA } from "@/components/dashboard/DashboardSubscribeCTA";
import { ManageSubscriptionButton } from "@/components/dashboard/ManageSubscriptionButton";
import { buildCreditStripModel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
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

  let stripeCustomerId: string | null = null;
  let planTier: string | null = null;
  let subscriptionInterval: string | null = null;
  if (user && hasActiveSubscription) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan_tier, subscription_interval")
      .eq("id", user.id)
      .maybeSingle();
    const raw = profile?.stripe_customer_id;
    stripeCustomerId =
      typeof raw === "string" && raw.trim() ? raw.trim() : null;
    planTier =
      typeof profile?.plan_tier === "string" ? profile.plan_tier : null;
    subscriptionInterval =
      typeof profile?.subscription_interval === "string"
        ? profile.subscription_interval
        : null;
  }

  const showManageSubscription =
    hasActiveSubscription && Boolean(stripeCustomerId);

  // Monthly Coach only. A null interval means comped, webhook-incomplete, or
  // otherwise unknown cadence — render nothing rather than pitch annual to
  // someone who already has it.
  const showAnnualUpgrade =
    hasActiveSubscription &&
    Boolean(stripeCustomerId) &&
    planTier === "coach" &&
    subscriptionInterval === "month";

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

      {stripModel ? (
        <CreditStrip
          model={stripModel}
          showAddCreditsLink={false}
          action={
            showManageSubscription ? <ManageSubscriptionButton /> : undefined
          }
        />
      ) : null}

      {showAnnualUpgrade ? (
        <div className="mb-6 max-w-3xl">
          <AnnualUpgradePrompt />
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
