import { permanentRedirect } from "next/navigation";

/** Invite links, emails, and bookmarks still hit this path. */
export default function MentoringRedirectPage() {
  permanentRedirect("/dashboard/develop");
}
