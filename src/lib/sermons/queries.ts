import { createClient } from "@/lib/supabase/server";
import type { SermonListItem, SermonWithLatestVersion } from "./types";

export async function listSermons(): Promise<SermonListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .select("id, title, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSermonWithLatestVersion(
  id: string,
): Promise<SermonWithLatestVersion | null> {
  const supabase = await createClient();

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sermonError) {
    throw new Error(sermonError.message);
  }

  if (!sermon) {
    return null;
  }

  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("*")
    .eq("sermon_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    throw new Error(versionError.message);
  }

  return { ...sermon, latest_version: version };
}
