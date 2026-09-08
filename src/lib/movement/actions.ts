"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import { getLatestThemeDiagnostic } from "@/lib/prep-card/queries";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import { buildMovementReportSnapshot } from "./build";
import { THEME_MEASURES, type MovementThemeId } from "./themes";
import type { MovementCount } from "./types";
import { MOVEMENT_MIN_NEW_SERMONS } from "./types";
import {
  getOpenMovementBaseline,
  insertMovementBaseline,
  insertMovementReport,
  loadComparisonSermons,
  loadSermonsByIds,
} from "./queries";

export type MovementActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function requirePrepCardUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!(await profileHasPrepCardAccess(user.id))) {
    return { ok: false, error: "Movement report is not available on this account." };
  }
  return { ok: true, userId: user.id };
}

/**
 * Lock a work-quarter baseline from the latest theme diagnostic focus.
 * Freezes sermon ids and counts so regenerating the desk card cannot move the goalposts.
 */
export async function lockMovementBaselineAction(): Promise<MovementActionResult> {
  const auth = await requirePrepCardUser();
  if (!auth.ok) {
    return auth;
  }

  const existing = await getOpenMovementBaseline(auth.userId);
  if (existing) {
    return { ok: false, error: "A work quarter is already open for this theme." };
  }

  const card = await getLatestThemeDiagnostic();
  if (!card) {
    return {
      ok: false,
      error:
        "Build a theme diagnostic first. The movement baseline locks its focus three.",
    };
  }

  const focus = card.snapshot.focus ?? [];
  if (focus.length === 0) {
    return {
      ok: false,
      error: "The diagnostic has no focus disciplines to lock.",
    };
  }

  const focusMeasureIds = focus.map((row) => row.id as PrepMeasureId);
  const themeId: MovementThemeId =
    card.snapshot.themeId === "christ" ? "christ" : "ask";
  const themeIds = THEME_MEASURES[themeId];
  const countIds = [...new Set([...focusMeasureIds, ...themeIds])];
  const byId = new Map(
    (card.snapshot.counts ?? []).map((row) => [row.id, row] as const),
  );

  const baselineCounts: MovementCount[] = countIds.map((id) => {
    const row = byId.get(id);
    return {
      measureId: id,
      hits: row?.hits ?? 0,
      eligible: row?.eligible ?? 0,
    };
  });

  const sermonIds = card.snapshot.sermonIds ?? [];
  if (sermonIds.length === 0) {
    return { ok: false, error: "Diagnostic snapshot is missing sermon ids." };
  }

  const baseline = await insertMovementBaseline({
    userId: auth.userId,
    themeId,
    focusMeasureIds,
    baselineCounts,
    sermonIds,
    prepCardId: card.id,
    generatedAt: card.snapshot.generatedAt,
  });

  revalidatePath("/dashboard/movement");
  return { ok: true, id: baseline.id };
}

export async function generateMovementReportAction(): Promise<MovementActionResult> {
  const auth = await requirePrepCardUser();
  if (!auth.ok) {
    return auth;
  }

  const baseline = await getOpenMovementBaseline(auth.userId);
  if (!baseline) {
    return {
      ok: false,
      error: "Lock a work-quarter baseline from your theme diagnostic first.",
    };
  }

  const comparisonSermons = await loadComparisonSermons({
    userId: auth.userId,
    baselineSermonIds: baseline.sermonIds,
    afterIso: baseline.generatedAt,
  });

  if (comparisonSermons.length < MOVEMENT_MIN_NEW_SERMONS) {
    return {
      ok: false,
      error: `Your movement report opens at ${MOVEMENT_MIN_NEW_SERMONS} new sermons. You have ${comparisonSermons.length}.`,
    };
  }

  const baselineSermons = await loadSermonsByIds(baseline.sermonIds);
  try {
    const built = await buildMovementReportSnapshot({
      baseline,
      baselineSermons,
      comparisonSermons,
    });
    if (!built.ok) {
      return {
        ok: false,
        error: `Your movement report opens at ${built.need} new sermons. You have ${built.have}.`,
      };
    }
    const row = await insertMovementReport({
      userId: auth.userId,
      baselineId: baseline.id,
      themeId: baseline.themeId,
      comparisonSampleSize: built.snapshot.comparisonSampleSize,
      snapshot: built.snapshot,
    });
    revalidatePath("/dashboard/movement");
    return { ok: true, id: row.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Movement report generation failed";
    console.error("[movement]", message);
    return { ok: false, error: message };
  }
}
