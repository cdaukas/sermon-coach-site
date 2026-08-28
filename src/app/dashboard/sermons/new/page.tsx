import type { Metadata } from "next";
import Link from "next/link";
import { NewSermonWorkspace } from "@/components/dashboard/NewSermonWorkspace";
import { createClient } from "@/lib/supabase/server";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { getMenteeCoachingView } from "@/lib/mentor/relationship";

export const metadata: Metadata = {
  title: "New evaluation",
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
  const coachingView = user
    ? await getMenteeCoachingView(user.id)
    : {
        isMentoredMentee: false,
        menteeReadsNone: false,
        debriefVisibleSince: null,
        mentorName: "your mentor",
      };
  const isMentoredMentee = coachingView.isMentoredMentee;

  let churchName: string | null = null;
  let spanishEnabled = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("church_name")
      .eq("id", user.id)
      .maybeSingle();
    const raw = profile?.church_name;
    churchName =
      typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

    const { data: spanishRow } = await supabase
      .from("profiles")
      .select("spanish_enabled")
      .eq("id", user.id)
      .maybeSingle();
    spanishEnabled = spanishRow?.spanish_enabled === true;
  }

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

      <NewSermonWorkspace
        entitlement={entitlement}
        isMentoredMentee={isMentoredMentee}
        menteeReadsNone={coachingView.menteeReadsNone}
        churchName={churchName}
        spanishEnabled={spanishEnabled}
      />
    </main>
  );
}
