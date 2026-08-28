import { notFound, redirect } from "next/navigation";
import { isMentoringUiAllowed } from "@/lib/mentor/uiAccess";
import { createClient } from "@/lib/supabase/server";

/** Invite creation now lives at /dashboard/develop. */
export default async function MentorInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isMentoringUiAllowed(user.id)) {
    notFound();
  }

  redirect("/dashboard/develop");
}
