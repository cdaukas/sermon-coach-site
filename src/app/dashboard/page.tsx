import { DashboardLibrary } from "@/components/dashboard/DashboardLibrary";
import { EmptyLibraryCard } from "@/components/dashboard/EmptyLibraryCard";
import { NewEvaluationButton } from "@/components/dashboard/NewEvaluationButton";
import { PurchaseArrivalBand } from "@/components/dashboard/PurchaseArrivalBand";
import {
  getMostRecentPackGrant,
  isWithinMinutes,
  packSourceDisplayName,
} from "@/lib/billing/pack-credits";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { profileHasGrowthAccess } from "@/lib/growth/access";
import { getMenteeCoachingView } from "@/lib/mentor/relationship";
import {
  listDashboardSermons,
  listDeletedSermons,
} from "@/lib/sermons/queries";
import { createClient } from "@/lib/supabase/server";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const ARRIVAL_WINDOW_MINUTES = 10;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [sermons, deleted, entitlement, recentGrant, growthAllowed, coachingView] =
    await Promise.all([
      listDashboardSermons(),
      listDeletedSermons(),
      user ? getEvaluationEntitlement(user.id) : Promise.resolve(null),
      getMostRecentPackGrant(),
      user ? profileHasGrowthAccess(user.id) : Promise.resolve(false),
      user
        ? getMenteeCoachingView(user.id)
        : Promise.resolve({
            isMentoredMentee: false,
            menteeReadsNone: false,
            mentorName: "your mentor",
          }),
    ]);

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

  // Neutral empty state for accounts with no free/sub/pack credits — not depleted.
  // Mentor-only buyers land here; do not push "submit a sermon" as primary CTA.
  const zeroCredits =
    entitlement != null &&
    !entitlement.subscriptionActive &&
    entitlement.freeRemaining <= 0 &&
    entitlement.packRemaining <= 0;

  const emptyKind = packArrival
    ? ("pack" as const)
    : subscriptionArrival
      ? ("subscription" as const)
      : zeroCredits
        ? ("chooser" as const)
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
          {libraryEmpty && emptyKind === "chooser"
            ? "Your account"
            : "Your sermons"}
        </h1>
      </div>
      {emptyKind === "chooser" ? null : <NewEvaluationButton />}
    </div>
  );

  return (
    <div>
      {pageHeader}

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
      ) : null}

      <DashboardLibrary
        sermons={sermons}
        deleted={deleted}
        growthAllowed={growthAllowed}
        hideUnevaluatedBand={coachingView.menteeReadsNone}
      />
    </div>
  );
}
