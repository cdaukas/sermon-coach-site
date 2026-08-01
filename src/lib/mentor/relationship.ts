import { createClient } from "@/lib/supabase/server";

/**
 * True when the signed-in user is the mentee on an ACTIVE mentor relationship.
 * On select error, returns false so the UI fails toward the normal Coach view.
 */
export async function viewerHasActiveMentorRelationship(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentor_relationships")
    .select("id")
    .eq("mentee_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return false;
  }

  return data != null;
}
