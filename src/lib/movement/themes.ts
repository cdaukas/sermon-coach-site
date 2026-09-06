/**
 * Delivery themes for the six-month arc.
 * Only "the ask" is live; other themes are named for storage keys.
 */

import type { PrepMeasureId } from "@/lib/prep-card/measures";

export const MOVEMENT_THEME_IDS = [
  "ask",
  "christ",
  "room",
  "delight",
] as const;

export type MovementThemeId = (typeof MOVEMENT_THEME_IDS)[number];

/** Theme → measure ids that belong to it (for "did not work on"). */
export const THEME_MEASURES: Record<MovementThemeId, PrepMeasureId[]> = {
  /** Named object, named cost, reciprocal, naming valence. */
  ask: [2, 3, 7, 9],
  christ: [6],
  room: [12],
  delight: [],
};

export const DEFAULT_THEME: MovementThemeId = "ask";

export function themeDisplayName(id: MovementThemeId): string {
  switch (id) {
    case "ask":
      return "The ask";
    case "christ":
      return "Christ in the sermon";
    case "room":
      return "Who is in the room";
    case "delight":
      return "Delight and difficulty";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
