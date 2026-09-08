import { getLatestThemeDiagnostic } from "@/lib/prep-card/queries";
import {
  countComparisonSermons,
  getOpenMovementBaseline,
} from "@/lib/movement/queries";
import { MOVEMENT_MIN_NEW_SERMONS } from "@/lib/movement/types";

export type DeepDiveTarget = {
  href: "/dashboard/movement" | "/dashboard/ask-theme" | "/dashboard/christ-theme";
  label: "Deep dive";
};

/**
 * Resolve which deep-dive surface the rail should open.
 * Movement when a work-quarter baseline is open and enough new sermons
 * have landed; otherwise the latest theme diagnostic.
 *
 * Fail soft: missing movement tables or any query error must not crash
 * the dashboard shell. Treat as no open baseline and fall through.
 */
export async function resolveDeepDiveHref(
  userId: string,
): Promise<DeepDiveTarget> {
  try {
    const baseline = await getOpenMovementBaseline(userId);
    if (baseline) {
      const newCount = await countComparisonSermons({
        userId,
        baselineSermonIds: baseline.sermonIds,
        afterIso: baseline.generatedAt,
      });
      if (newCount >= MOVEMENT_MIN_NEW_SERMONS) {
        return { href: "/dashboard/movement", label: "Deep dive" };
      }
    }
  } catch (error) {
    console.warn(
      "[deep_dive] movement lookup failed; falling through to theme diagnostic",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    const diagnostic = await getLatestThemeDiagnostic();
    if (diagnostic?.snapshot.themeId === "christ") {
      return { href: "/dashboard/christ-theme", label: "Deep dive" };
    }
  } catch (error) {
    console.warn(
      "[deep_dive] theme diagnostic lookup failed; defaulting to ask-theme",
      error instanceof Error ? error.message : error,
    );
  }

  return { href: "/dashboard/ask-theme", label: "Deep dive" };
}
