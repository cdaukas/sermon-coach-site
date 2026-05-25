import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border px-4 py-2 text-[13px] font-medium transition-colors hover:border-[var(--sc-ink)]"
            style={{
              fontFamily: "var(--font-ui)",
              background: "var(--sc-panel)",
              borderColor: "var(--sc-rule)",
              color: "var(--sc-ink)",
            }}
          >
            Sign out
          </button>
        </form>
      </header>

      {children}
    </div>
  );
}
