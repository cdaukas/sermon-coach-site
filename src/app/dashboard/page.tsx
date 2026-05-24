import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon <span style={{ color: "var(--sc-accent)" }}>&amp;</span>{" "}
          Coach
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

      <main
        className="rounded px-8 py-10"
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "var(--font-ui)",
            color: "var(--sc-accent)",
          }}
        >
          Dashboard
        </p>
        <h1
          className="mb-4 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          You&apos;re signed in
        </h1>
        <p
          className="text-lg leading-relaxed"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--sc-ink-soft)",
            fontStyle: "italic",
          }}
        >
          Signed in as{" "}
          <span style={{ color: "var(--sc-ink)", fontStyle: "normal" }}>
            {user.email}
          </span>
          . Your sermon library and evaluations will live here soon.
        </p>
      </main>
    </div>
  );
}
