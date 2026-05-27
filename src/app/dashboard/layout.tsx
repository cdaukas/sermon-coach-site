import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — The Sermon Coach",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Session prewarm (@supabase/ssr) — keep before any child data fetch.
   *
   * Why: First RSC render after login can race session-cookie hydration;
   * child Server Components that call createClient() may see auth.uid() as
   * null, so RLS hides rows even when the user is logged in.
   *
   * If removed: evaluation pages can 404 (getEvaluation → null → notFound)
   * with valid auth and valid result JSON in the database.
   *
   * Debugged 2026-05-25 (symptom also mimicked stale .next dev cache).
   */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: "var(--sc-bg)" }}
    >
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
