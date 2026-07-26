import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StartClaimed } from "@/components/start/StartClaimed";
import { StartLanding } from "@/components/start/StartLanding";
import { StartRedirect } from "@/components/start/StartRedirect";
import { isEligibleForAcquisitionPrompt } from "@/lib/auth/acquisition-gate";
import { FIRST_EVAL_PATH } from "@/lib/auth/start";
import {
  claimSketchRead,
  clearSketchClaimOkCookie,
  resolveSketchClaimToken,
  SKETCH_CLAIM_COOKIE,
  SKETCH_CLAIM_OK_COOKIE,
} from "@/lib/sketch/claim";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create a free account and get your first sermon evaluation — no card, no commitment.",
};

type StartPageProps = {
  searchParams: Promise<{ claim?: string | string[] }>;
};

export default async function StartPage({ searchParams }: StartPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const claimParam = Array.isArray(params.claim) ? params.claim[0] : params.claim;

  if (user) {
    const jar = await cookies();
    const token = resolveSketchClaimToken(
      jar.get(SKETCH_CLAIM_COOKIE)?.value,
      claimParam,
    );
    const claimedNow = token ? await claimSketchRead(user.id, token) : false;
    // Confirm may have claimed already and set this cookie before redirecting here.
    const claimedViaConfirm = jar.get(SKETCH_CLAIM_OK_COOKIE)?.value === "1";

    if (claimedNow || claimedViaConfirm) {
      await clearSketchClaimOkCookie();
      return <StartClaimed />;
    }

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

  return <StartLanding claimToken={claimParam ?? null} />;
}
