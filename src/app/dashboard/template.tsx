import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Template (not layout) so DashboardShell remounts on every dashboard
 * navigation. Layouts soft-nav keep their RSC payload; after a credit is
 * consumed the rail chip would otherwise stay one behind the page strip.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
