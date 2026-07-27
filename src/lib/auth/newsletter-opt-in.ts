import { createClient } from "@/lib/supabase/client";

/**
 * Persist Friday-post opt-in for the signed-in user via SECURITY DEFINER RPC.
 * No-op if RPC fails — never block signup.
 */
export async function setNewsletterOptedIn(optedIn: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_newsletter_opted_in", {
    p_opted_in: optedIn,
  });

  if (error) {
    console.error("set_newsletter_opted_in failed:", error.message);
  }
}
