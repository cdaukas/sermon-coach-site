import { createClient } from "@/lib/supabase/server";

export type PackCreditsSummary = {
  totalRemaining: number;
  soonestExpiry: string | null; // ISO date of the soonest-expiring grant that still has credits
};

export type RecentPackGrant = {
  source: string;
  quantityTotal: number;
  quantityRemaining: number;
  grantedAt: string;
};

export async function getPackCredits(): Promise<PackCreditsSummary | null> {
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("eval_credit_grants")
    .select("quantity_remaining, expires_at")
    .gt("quantity_remaining", 0)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (error) {
    // Never break the dashboard over a billing read. Log and show nothing.
    console.error("getPackCredits failed", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null; // no live grants -> card will not render
  }

  const totalRemaining = data.reduce(
    (sum, row) => sum + (row.quantity_remaining ?? 0),
    0,
  );
  const datedExpiries = data
    .map((row) => row.expires_at)
    .filter((expiry): expiry is string => expiry != null)
    .sort((a, b) => a.localeCompare(b));
  const soonestExpiry = datedExpiries[0] ?? null;

  return { totalRemaining, soonestExpiry };
}

/** Most recent pack grant for purchase-arrival copy. Additive read. */
export async function getMostRecentPackGrant(): Promise<RecentPackGrant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("eval_credit_grants")
    .select("source, quantity_total, quantity_remaining, granted_at, created_at")
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getMostRecentPackGrant failed", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    source: data.source,
    quantityTotal: data.quantity_total,
    quantityRemaining: data.quantity_remaining,
    grantedAt: data.granted_at ?? data.created_at,
  };
}

export function packSourceDisplayName(source: string): string {
  switch (source) {
    case "pack_2":
      return "Guest Preacher";
    case "pack_6":
      return "Pulpit Supply";
    case "pack_12":
      return "Series Prep";
    default:
      return "Pack";
  }
}

export function isWithinMinutes(iso: string, minutes: number): boolean {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= minutes * 60_000;
}
