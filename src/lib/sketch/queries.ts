import { createClient } from "@/lib/supabase/server";
import type { SketchField, SketchStatus } from "@/lib/sketch/types";
import { SKETCH_FIELDS } from "@/lib/sketch/types";

export type ReadinessReadListItem = {
  id: string;
  primary_passage: string | null;
  created_at: string;
};

export type ReadinessReadRow = {
  id: string;
  primary_passage: string | null;
  ache: string;
  big_idea: string;
  gospel_turn: string;
  points: string;
  one_person: string;
  ending: string;
  read_output: string;
  status_ache: SketchStatus | null;
  status_big_idea: SketchStatus | null;
  status_gospel_turn: SketchStatus | null;
  status_points: SketchStatus | null;
  status_one_person: SketchStatus | null;
  status_ending: SketchStatus | null;
  created_at: string;
};

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

function isSketchStatus(value: unknown): value is SketchStatus {
  return value === "solid" || value === "thin" || value === "seam";
}

/** Map stored status_* columns into the SketchReportView status map. */
export function statusMapFromRow(
  row: Pick<
    ReadinessReadRow,
    | "status_ache"
    | "status_big_idea"
    | "status_gospel_turn"
    | "status_points"
    | "status_one_person"
    | "status_ending"
  >,
): Partial<Record<SketchField, SketchStatus>> {
  const raw: Record<SketchField, unknown> = {
    ache: row.status_ache,
    big_idea: row.status_big_idea,
    gospel_turn: row.status_gospel_turn,
    points: row.status_points,
    one_person: row.status_one_person,
    ending: row.status_ending,
  };
  const out: Partial<Record<SketchField, SketchStatus>> = {};
  for (const field of SKETCH_FIELDS) {
    const v = raw[field];
    if (isSketchStatus(v)) out[field] = v;
  }
  return out;
}

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

  return (data ?? []) as ReadinessReadListItem[];
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

  return (data ?? []) as ReadinessReadRow[];
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

  return (data as ReadinessReadRow | null) ?? null;
}
