import type { Metadata } from "next";
import Link from "next/link";
import { NewSermonWorkspace } from "@/components/dashboard/NewSermonWorkspace";
import { createClient } from "@/lib/supabase/server";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";

export const metadata: Metadata = {
  title: "New Sermon",
};

const uiFont = { fontFamily: "var(--font-ui)" };

export default async function NewSermonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entitlement = user
    ? await getEvaluationEntitlement(user.id)
    : null;

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <Link
        href="/dashboard"
        className="mb-8 inline-block text-[13px] font-medium no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        ← Back to library
      </Link>

      <NewSermonWorkspace entitlement={entitlement} />
    </main>
  );
}
