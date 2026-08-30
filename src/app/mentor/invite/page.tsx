import { notFound, redirect } from "next/navigation";
import { getMentorSeatCapacity } from "@/lib/mentor/capacity";
import { canAccessMentoringUi } from "@/lib/mentor/uiAccess";
import { createClient } from "@/lib/supabase/server";

/** Invite creation now lives at /dashboard/develop. */
export default async function MentorInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const capacity = await getMentorSeatCapacity();
  if (!canAccessMentoringUi(user.id, capacity)) {
    notFound();
  }

  redirect("/dashboard/develop");
}
