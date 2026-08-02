import { CreditStrip } from "@/components/dashboard/CreditStrip";
import { EmptyLibraryCard } from "@/components/dashboard/EmptyLibraryCard";
import { NewEvaluationButton } from "@/components/dashboard/NewEvaluationButton";
import { PurchaseArrivalBand } from "@/components/dashboard/PurchaseArrivalBand";
import { SermonList } from "@/components/dashboard/SermonList";
import {
  buildCreditStripModel,
} from "@/lib/billing/credit-display";
import {
  getMostRecentPackGrant,
  isWithinMinutes,
  packSourceDisplayName,
} from "@/lib/billing/pack-credits";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { listDashboardSermons } from "@/lib/sermons/queries";
import { createClient } from "@/lib/supabase/server";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const ARRIVAL_WINDOW_MINUTES = 10;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sermons, entitlement, recentGrant] = await Promise.all([
    listDashboardSermons(),
    user ? getEvaluationEntitlement(user.id) : Promise.resolve(null),
    getMostRecentPackGrant(),
  ]);

  const stripModel = buildCreditStripModel(entitlement);
  const libraryEmpty = sermons.length === 0;

  const recentPackArrival =
    recentGrant && isWithinMinutes(recentGrant.grantedAt, ARRIVAL_WINDOW_MINUTES)
      ? recentGrant
      : null;

  const subscriptionArrival =
    libraryEmpty &&
    entitlement?.subscriptionActive === true &&
    (entitlement.usage?.used ?? 0) === 0;

  const packArrival = libraryEmpty && recentPackArrival != null;

  const emptyKind = packArrival
    ? ("pack" as const)
    : subscriptionArrival
      ? ("subscription" as const)
      : ("free" as const);

  const showPurchaseBand = !libraryEmpty && recentPackArrival != null;

  const pageHeader = (
    <div
      className="mb-6 flex flex-wrap items-end justify-between gap-4"
      style={{
        borderBottom: "1px solid #d4cfc1",
        paddingBottom: 18,
      }}
    >
      <div className="min-w-0">
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
      <NewEvaluationButton />
    </div>
  );

  return (
    <div>
      {pageHeader}

      {stripModel ? <CreditStrip model={stripModel} /> : null}

      {showPurchaseBand && recentPackArrival ? (
        <PurchaseArrivalBand
          packName={packSourceDisplayName(recentPackArrival.source)}
          creditCount={recentPackArrival.quantityTotal}
          grantKey={`${recentPackArrival.source}:${recentPackArrival.grantedAt}`}
        />
      ) : null}

      {libraryEmpty ? (
        <EmptyLibraryCard
          kind={emptyKind}
          packName={
            packArrival && recentPackArrival
              ? packSourceDisplayName(recentPackArrival.source)
              : undefined
          }
          packCredits={
            packArrival && recentPackArrival
              ? recentPackArrival.quantityTotal
              : undefined
          }
        />
      ) : (
        <SermonList sermons={sermons} />
      )}
    </div>
  );
}
