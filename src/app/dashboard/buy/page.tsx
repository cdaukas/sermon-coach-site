import type { Metadata } from "next";
import { BuyPackCards } from "@/components/dashboard/BuyPackCards";
import { CreditStrip } from "@/components/dashboard/CreditStrip";
import { DashboardSubscribeCTA } from "@/components/dashboard/DashboardSubscribeCTA";
import { buildCreditStripModel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plan and credits",
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
          Account
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Plan and credits
        </h1>
      </div>

      {stripModel ? (
        <CreditStrip model={stripModel} showAddCreditsLink={false} />
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
