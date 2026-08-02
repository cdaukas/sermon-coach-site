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
  mode: "find" | "press" | null;
  created_at: string;
};

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
