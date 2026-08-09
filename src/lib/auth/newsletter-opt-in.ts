import { createClient } from "@/lib/supabase/client";

/**
 * Persist Friday-post and Tuesday-nudge opt-ins for the signed-in user
 * via SECURITY DEFINER RPC. No-op if RPC fails — never block signup.
 */
export async function setEmailPreferencesAtSignup(
  newsletterOptedIn: boolean,
  tuesdayNudgeOptedIn: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_email_preferences", {
    p_newsletter: newsletterOptedIn,
    p_tuesday_nudge: tuesdayNudgeOptedIn,
  });

  if (error) {
    console.error("set_email_preferences failed:", error.message);
  }
}
