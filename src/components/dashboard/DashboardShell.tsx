import type { ReactNode } from "react";
import { DashboardRail } from "./DashboardRail";
import { formatCreditChipLabel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { createClient } from "@/lib/supabase/server";

type DashboardShellProps = {
  children: ReactNode;
};

export async function DashboardShell({ children }: DashboardShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entitlement = user
    ? await getEvaluationEntitlement(user.id)
    : null;

  const chip = formatCreditChipLabel(entitlement);

  return (
    <div className="dashboard-shell">
      <DashboardRail creditChipLabel={chip} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
