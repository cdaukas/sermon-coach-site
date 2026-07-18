import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StartLanding } from "@/components/start/StartLanding";
import { StartRedirect } from "@/components/start/StartRedirect";
import { isEligibleForAcquisitionPrompt } from "@/lib/auth/acquisition-gate";
import { FIRST_EVAL_PATH } from "@/lib/auth/start";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create a free account and get your first sermon evaluation — no card, no commitment.",
};

export default async function StartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("acquisition_source_at, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!isEligibleForAcquisitionPrompt(profile)) {
      redirect(FIRST_EVAL_PATH);
    }

    return <StartRedirect />;
  }

  return <StartLanding />;
}
