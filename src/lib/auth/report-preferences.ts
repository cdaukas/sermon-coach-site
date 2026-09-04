import { createClient } from "@/lib/supabase/server";

/**
 * Live read of the signed-in viewer's Methodology preference.
 *
 * Presentation only. The flag is never stamped onto sermon_evaluations, so an
 * evaluation rendered today reflects the setting as it stands right now — not
 * as it stood when the evaluation ran.
 *
 * The viewer's own profile governs: a mentee resolves as the owner of their
 * report and sees their setting; a mentor viewing a mentee's report sees his
 * own. Falls back to true (the column default) whenever the row cannot be
 * read, so a failed lookup shows the block rather than silently dropping it.
 */
export async function viewerIncludesMethodologyInReports(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return true;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("include_methodology_in_reports")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.include_methodology_in_reports !== false;
}
