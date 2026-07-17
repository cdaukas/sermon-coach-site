import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StartLanding } from "@/components/start/StartLanding";
import { StartRedirect } from "@/components/start/StartRedirect";
import { START_DESTINATION } from "@/lib/auth/start";
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
      .select("acquisition_source_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.acquisition_source_at) {
      redirect(START_DESTINATION);
    }

    return <StartRedirect />;
  }

  return <StartLanding />;
}
