import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-shell mx-auto w-full max-w-[1100px] px-6 py-12">
      <AppHeader />
      {children}
    </div>
  );
}
