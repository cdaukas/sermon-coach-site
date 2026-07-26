import { createClient } from "@/lib/supabase/server";
import type {
  ReadinessReadListItem,
  ReadinessReadRow,
} from "@/lib/sketch/readiness-read";

export type { ReadinessReadListItem, ReadinessReadRow } from "@/lib/sketch/readiness-read";
export { statusMapFromRow } from "@/lib/sketch/readiness-read";

const LIST_SELECT = "id, primary_passage, created_at";

const DETAIL_SELECT = [
  "id",
  "primary_passage",
  "ache",
  "big_idea",
  "gospel_turn",
  "points",
  "one_person",
  "ending",
  "read_output",
  "status_ache",
  "status_big_idea",
  "status_gospel_turn",
  "status_points",
  "status_one_person",
  "status_ending",
  "created_at",
].join(", ");

/**
 * Current user's readiness_reads, newest first.
 * Relies on RLS (auth.uid() = user_id); also filters by user_id explicitly.
 */
export async function listReadinessReadsForUser(
  userId: string,
): Promise<ReadinessReadListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_reads")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ReadinessReadListItem[];
}

/**
 * Current user's readiness_reads with fields needed to re-render SketchReportView.
 * Newest first. Relies on RLS; also filters by user_id explicitly.
 */
export async function listReadinessReadsDetailForUser(
  userId: string,
): Promise<ReadinessReadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_reads")
    .select(DETAIL_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ReadinessReadRow[];
}

/**
 * One readiness_reads row for the current user, or null.
 * RLS + explicit user_id filter.
 */
export async function getReadinessReadForUser(
  userId: string,
  readId: string,
): Promise<ReadinessReadRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_reads")
    .select(DETAIL_SELECT)
    .eq("user_id", userId)
    .eq("id", readId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as ReadinessReadRow | null) ?? null;
}
