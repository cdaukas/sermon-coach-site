import type { ReactNode } from "react";
import { DashboardRail } from "./DashboardRail";
import { formatCreditChipLabel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { isMentoringUiAllowed } from "@/lib/mentor/uiAccess";
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
  const mentoringUiAllowed = user ? isMentoringUiAllowed(user.id) : false;

  return (
    <div className="dashboard-shell">
      <DashboardRail
        creditChipLabel={chip}
        mentoringUiAllowed={mentoringUiAllowed}
      />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
