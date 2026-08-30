import type { ReactNode } from "react";
import { headers } from "next/headers";
import { DashboardRail } from "./DashboardRail";
import { formatCreditChipLabel } from "@/lib/billing/credit-display";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { profileHasGrowthAccess } from "@/lib/growth/access";
import { createClient } from "@/lib/supabase/server";

type DashboardShellProps = {
  children: ReactNode;
};

/**
 * PDF export (?pdf=1) omits the rail entirely — sticky nav must not participate
 * in Chromium pagination. Wordmark is rendered here because the rail’s brand
 * mark would otherwise disappear with the chrome.
 */
export async function DashboardShell({ children }: DashboardShellProps) {
  const headerList = await headers();
  const pdfCapture = headerList.get("x-sc-pdf-capture") === "1";

  if (pdfCapture) {
    return (
      <div className="dashboard-shell dashboard-shell--pdf-export">
        <p className="evaluation-pdf-export-wordmark">The Sermon Coach™</p>
        <div className="dashboard-content dashboard-content--pdf-export">
          {children}
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entitlement = user
    ? await getEvaluationEntitlement(user.id)
    : null;

  const chip = formatCreditChipLabel(entitlement);
  const growthAllowed = user ? await profileHasGrowthAccess(user.id) : false;

  return (
    <div className="dashboard-shell">
      <DashboardRail
        creditChipLabel={chip}
        growthAllowed={growthAllowed}
      />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
