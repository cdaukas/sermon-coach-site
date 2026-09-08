"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildChristThemeSnapshot } from "@/lib/christ-theme/build";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import {
  insertPrepCard,
  loadSermonsForPrepCard,
} from "@/lib/prep-card/queries";

export type GenerateChristThemeResult =
  | { ok: true; cardId: string; sampleSize: number }
  | { ok: false; error: string };

export async function generateChristThemeAction(): Promise<GenerateChristThemeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  if (!(await profileHasPrepCardAccess(user.id))) {
    return {
      ok: false,
      error: "Christ theme report is not available on this account.",
    };
  }

  const sermons = await loadSermonsForPrepCard(user.id);
  if (sermons.length === 0) {
    return {
      ok: false,
      error: "No sermons to build from. Add a manuscript or transcript first.",
    };
  }

  try {
    const snapshot = await buildChristThemeSnapshot(sermons);
    const row = await insertPrepCard(user.id, snapshot);
    revalidatePath("/dashboard/christ-theme");
    return {
      ok: true,
      cardId: row.id,
      sampleSize: snapshot.sampleSize,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Christ theme report generation failed";
    console.error("[christ_theme]", message);
    return { ok: false, error: message };
  }
}
