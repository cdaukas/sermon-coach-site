import { redirect } from "next/navigation";

/** Invite creation now lives in the dashboard mentoring surface. */
export default function MentorInvitePage() {
  redirect("/dashboard/mentoring");
}
