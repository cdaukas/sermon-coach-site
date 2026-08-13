import { createAdminClient } from "@/lib/supabase/admin";
import { statusMapFromRow } from "@/lib/sketch/readiness-read";
import type { SketchField, SketchStatus, SketchStatusMap } from "@/lib/sketch/types";

export type PublicSampleSketch = {
  readId: string;
  primaryPassage: string | null;
  answers: Record<SketchField, string>;
  readOutput: string;
  status: SketchStatusMap;
};

/**
 * Load the single flagged public sample Sketch via service role.
 * Does not loosen RLS. Returns null when no row is flagged or read_output is empty.
 */
export async function getPublicSampleSketch(): Promise<PublicSampleSketch | null> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("readiness_reads")
    .select(
      "id, primary_passage, ache, big_idea, gospel_turn, points, one_person, ending, read_output, status_ache, status_big_idea, status_gospel_turn, status_points, status_one_person, status_ending",
    )
    .eq("is_public_sample", true)
    .maybeSingle();

  if (error) {
    console.error("[getPublicSampleSketch] select failed", error);
    return null;
  }

  if (!row || typeof row.read_output !== "string" || !row.read_output.trim()) {
    return null;
  }

  return {
    readId: row.id as string,
    primaryPassage: (row.primary_passage as string | null) ?? null,
    answers: {
      ache: (row.ache as string) ?? "",
      big_idea: (row.big_idea as string) ?? "",
      gospel_turn: (row.gospel_turn as string) ?? "",
      points: (row.points as string) ?? "",
      one_person: (row.one_person as string) ?? "",
      ending: (row.ending as string) ?? "",
    },
    readOutput: row.read_output,
    status: statusMapFromRow({
      status_ache: row.status_ache as SketchStatus | null,
      status_big_idea: row.status_big_idea as SketchStatus | null,
      status_gospel_turn: row.status_gospel_turn as SketchStatus | null,
      status_points: row.status_points as SketchStatus | null,
      status_one_person: row.status_one_person as SketchStatus | null,
      status_ending: row.status_ending as SketchStatus | null,
    }),
  };
}
