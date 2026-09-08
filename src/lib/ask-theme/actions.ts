"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileHasPrepCardAccess } from "@/lib/prep-card/access";
import { buildPrepCardSnapshot } from "@/lib/prep-card/build";
import {
  insertPrepCard,
  loadSermonsForPrepCard,
} from "@/lib/prep-card/queries";

export type GenerateAskThemeResult =
  | { ok: true; cardId: string; sampleSize: number }
  | { ok: false; error: string };

export async function generateAskThemeAction(): Promise<GenerateAskThemeResult> {
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
      error: "Ask theme report is not available on this account.",
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
    const snapshot = await buildPrepCardSnapshot(sermons);
    const row = await insertPrepCard(user.id, snapshot);
    revalidatePath("/dashboard/ask-theme");
    revalidatePath("/dashboard/prep-card");
    return {
      ok: true,
      cardId: row.id,
      sampleSize: snapshot.sampleSize,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ask theme report generation failed";
    console.error("[ask_theme]", message);
    return { ok: false, error: message };
  }
}
