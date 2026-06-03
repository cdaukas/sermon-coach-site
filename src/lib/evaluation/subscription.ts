import { createClient } from "@/lib/supabase/server";

export const SUBSCRIPTION_INACTIVE_CODE = "SUBSCRIPTION_INACTIVE" as const;

export type SubscriptionStatus = "active" | "inactive";

export type SubscriptionGateResult =
  | { ok: true; status: "active" }
  | {
      ok: false;
      error: string;
      code?: typeof SUBSCRIPTION_INACTIVE_CODE;
    };

const INACTIVE_MESSAGE =
  "Subscribe to run sermon evaluations. Choose a plan on the pricing page, then try again.";

export async function getSubscriptionStatus(
  userId: string,
): Promise<SubscriptionStatus | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return profile.subscription_status === "active" ? "active" : "inactive";
}

export function isSubscriptionActive(
  status: SubscriptionStatus | null,
): boolean {
  return status === "active";
}

export async function checkSubscriptionActive(
  userId: string,
): Promise<SubscriptionGateResult> {
  const status = await getSubscriptionStatus(userId);

  if (!status) {
    return {
      ok: false,
      error: "Profile not found. Sign out and sign in again.",
    };
  }

  if (status !== "active") {
    return {
      ok: false,
      error: INACTIVE_MESSAGE,
      code: SUBSCRIPTION_INACTIVE_CODE,
    };
  }

  return { ok: true, status: "active" };
}
