import { createClient } from "@/lib/supabase/server";

export type PackCreditsSummary = {
  totalRemaining: number;
  soonestExpiry: string | null; // ISO date of the soonest-expiring grant that still has credits
};

export async function getPackCredits(): Promise<PackCreditsSummary | null> {
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("eval_credit_grants")
    .select("quantity_remaining, expires_at")
    .gt("quantity_remaining", 0)
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: true });

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
  const soonestExpiry = data[0]?.expires_at ?? null;

  return { totalRemaining, soonestExpiry };
}
