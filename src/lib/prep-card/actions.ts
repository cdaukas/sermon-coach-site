"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileHasPrepCardAccess } from "./access";
import { buildPrepCardSnapshot } from "./build";
import {
  getLatestThemeDiagnostic,
  insertPrepCard,
  loadSermonsForPrepCard,
} from "./queries";

export type GeneratePrepCardResult =
  | { ok: true; cardId: string; sampleSize: number }
  | { ok: false; error: string };

/**
 * Desk prep card. Not rate-limited, and not the quarterly deep dive.
 * Still built from the recent window so it can move between reports.
 * Locks strength/focus from the current theme diagnostic when one exists.
 */
export async function generatePrepCardAction(): Promise<GeneratePrepCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  if (!(await profileHasPrepCardAccess(user.id))) {
    return { ok: false, error: "Prep card is not available on this account." };
  }

  const sermons = await loadSermonsForPrepCard(user.id);
  if (sermons.length === 0) {
    return {
      ok: false,
      error: "No sermons to build from. Add a manuscript or transcript first.",
    };
  }

  try {
    const diagnostic = await getLatestThemeDiagnostic();
    const snapshot = await buildPrepCardSnapshot(sermons, {
      desk: true,
      lockedFrom: diagnostic?.snapshot ?? null,
    });
    const row = await insertPrepCard(user.id, snapshot);
    revalidatePath("/dashboard/prep-card");
    return {
      ok: true,
      cardId: row.id,
      sampleSize: snapshot.sampleSize,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Prep card generation failed";
    console.error("[prep_card]", message);
    return { ok: false, error: message };
  }
}
