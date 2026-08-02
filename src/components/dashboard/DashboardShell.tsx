import type { ReactNode } from "react";
import { DashboardRail } from "./DashboardRail";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { createClient } from "@/lib/supabase/server";

type DashboardShellProps = {
  children: ReactNode;
};

function creditChipLabel(input: {
  freeRemaining: number;
  packRemaining: number;
  subscriptionActive: boolean;
  usage: { used: number; limit: number } | null;
}): string {
  if (input.subscriptionActive && input.usage) {
    const left = Math.max(0, input.usage.limit - input.usage.used);
    return left === 1 ? "1 credit left" : `${left} credits left`;
  }

  const total = input.freeRemaining + input.packRemaining;
  if (total > 0) {
    return total === 1 ? "1 credit" : `${total} credits`;
  }

  return "Plan and credits";
}

export async function DashboardShell({ children }: DashboardShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entitlement = user
    ? await getEvaluationEntitlement(user.id)
    : null;

  const chip = entitlement
    ? creditChipLabel(entitlement)
    : "Plan and credits";

  return (
    <div className="dashboard-shell">
      <DashboardRail creditChipLabel={chip} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
