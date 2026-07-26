export const SKETCH_FIELDS = [
  "ache",
  "big_idea",
  "gospel_turn",
  "points",
  "one_person",
  "ending",
] as const;

export type SketchField = (typeof SKETCH_FIELDS)[number];
export type SketchStatus = "solid" | "thin" | "seam";
export type SketchStatusMap = Partial<Record<SketchField, SketchStatus>>;
export type OutlineForm = "outline" | "manuscript";

export type SketchIntake = {
  primary_passage: string;
  outline_form: OutlineForm;
  ache: string;
  big_idea: string;
  gospel_turn: string;
  points: string;
  one_person: string;
  ending: string;
};

export type SketchApiResponse = {
  read: string;
  status: SketchStatusMap;
  /** Present on /api/sketch/run so Save can stage without importing generate.ts. */
  prompt_version?: string;
  mode?: "find" | "press";
  seam_hub?: SketchField;
  seam_spokes?: string[];
  status_ache?: SketchStatus;
  status_big_idea?: SketchStatus;
  status_gospel_turn?: SketchStatus;
  status_points?: SketchStatus;
  status_one_person?: SketchStatus;
  status_ending?: SketchStatus;
};

/** Display labels for the AT A GLANCE table — alias only; keys stay internal. */
export const SKETCH_AREA_LABELS: Record<SketchField, string> = {
  ache: "The ache it speaks to",
  big_idea: "The one idea they carry to Tuesday",
  gospel_turn: "Where advice becomes good news",
  points: "Each point grounded in the passage",
  one_person: "The change you're preaching toward",
  ending: "How the last ninety seconds land",
};

/** Preacher-facing pill copy. Internal enum stays solid | thin | seam. */
export const SKETCH_STATUS_LABELS: Record<SketchStatus, string> = {
  solid: "Solid",
  thin: "Thin",
  seam: "In Tension",
};
