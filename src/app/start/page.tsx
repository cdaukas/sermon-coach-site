import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StartClaimed } from "@/components/start/StartClaimed";
import { StartLanding } from "@/components/start/StartLanding";
import { StartRedirect } from "@/components/start/StartRedirect";
import { isEligibleForAcquisitionPrompt } from "@/lib/auth/acquisition-gate";
import { FIRST_EVAL_PATH } from "@/lib/auth/start";
import {
  MENTOR_ACCEPT_PATH,
  MENTOR_INVITE_COOKIE,
  mentorAcceptPathWithToken,
} from "@/lib/mentor/invite";
import {
  resolveSketchClaimToken,
  SKETCH_CLAIM_COOKIE,
  SKETCH_CLAIM_OK_COOKIE,
} from "@/lib/sketch/claim";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create a free account and get your first sermon evaluation. No card, no commitment.",
};

type StartPageProps = {
  searchParams: Promise<{
    claim?: string | string[];
    saved?: string | string[];
    next?: string | string[];
  }>;
};

function safeRelativeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function StartPage({ searchParams }: StartPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const claimParam = Array.isArray(params.claim) ? params.claim[0] : params.claim;
  const savedParam = Array.isArray(params.saved) ? params.saved[0] : params.saved;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const preservedNext = safeRelativeNext(nextParam);

  if (user) {
    const jar = await cookies();
    // One-shot confirmation after /start/claim (or confirm → claim) succeeded.
    // Require the ok cookie so ?saved=1 alone cannot forge the landing.
    if (savedParam === "1" && jar.get(SKETCH_CLAIM_OK_COOKIE)?.value === "1") {
      return <StartClaimed />;
    }

    // Sketch claim BEFORE acquisition (proven ordering).
    const token = resolveSketchClaimToken(
      jar.get(SKETCH_CLAIM_COOKIE)?.value,
      claimParam,
    );
    if (token) {
      redirect(`/start/claim?claim=${encodeURIComponent(token)}`);
    }

    // Mentor invite BEFORE acquisition — same precedence as sketch claim.
    // Prefer surviving ?next=/mentor/accept?token=…, then cookie fallback.
    if (preservedNext?.startsWith(MENTOR_ACCEPT_PATH)) {
      redirect(preservedNext);
    }
    const mentorInviteToken = jar.get(MENTOR_INVITE_COOKIE)?.value?.trim();
    if (mentorInviteToken) {
      redirect(mentorAcceptPathWithToken(mentorInviteToken));
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
