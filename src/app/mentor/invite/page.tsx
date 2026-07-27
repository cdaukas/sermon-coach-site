import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { MentorInvitePanel } from "@/components/mentor/MentorInvitePanel";
import { MENTOR_INVITE_PATH } from "@/lib/mentor/invite";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Invite a mentee",
  description: "Create a mentoring invitation link.",
};

export default async function MentorInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(MENTOR_INVITE_PATH)}`,
    );
  }

  return (
    <AuthShell
      title="Invite a mentee"
      subtitle="Create a one-time link to start a mentoring relationship."
    >
      <MentorInvitePanel />
    </AuthShell>
  );
}
