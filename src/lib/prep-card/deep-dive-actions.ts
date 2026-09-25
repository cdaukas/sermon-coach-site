"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildChristThemeSnapshot } from "@/lib/christ-theme/build";
import { profileHasDeepDiveAccess } from "./access";
import { buildPrepCardSnapshot } from "./build";
import {
  deepDiveLockLines,
  deepDiveSelectionBlock,
  isDeepDiveQuarterLocked,
  type DeepDiveThemeId,
} from "./deep-dive-dashboard";
import { loadDeepDiveRuns, loadDeepDiveSermonsByIds } from "./deep-dive-data";
import { insertPrepCard } from "./queries";

export type GenerateDeepDiveResult =
  | { ok: true; href: string }
  | { ok: false; error: string };

export async function generateDeepDiveAction(input: {
  themeId: DeepDiveThemeId;
  sermonIds: string[];
}): Promise<GenerateDeepDiveResult> {
  const themeId = input.themeId;
  if (themeId !== "ask" && themeId !== "christ") {
    return { ok: false, error: "Choose a theme that is available." };
  }

  const block = deepDiveSelectionBlock(new Set(input.sermonIds).size);
  if (block) {
    return { ok: false, error: block };
  }
  if (new Set(input.sermonIds).size !== input.sermonIds.length) {
    return { ok: false, error: "Each sermon can only be selected once." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!(await profileHasDeepDiveAccess(user.id))) {
    return { ok: false, error: "Deep dive is not available on this account." };
  }

  const runs = await loadDeepDiveRuns(user.id);
  if (
    runs.latest &&
    isDeepDiveQuarterLocked(new Date(runs.latest.generatedAt), new Date())
  ) {
    const lines = deepDiveLockLines({
      themeId: runs.latest.themeId,
      generatedAt: new Date(runs.latest.generatedAt),
    });
    return { ok: false, error: lines.ranLine };
  }

  const sermons = await loadDeepDiveSermonsByIds(user.id, input.sermonIds);
  if (!sermons) {
    return {
      ok: false,
      error: "Some of those sermons are no longer available. Choose again.",
    };
  }

  try {
    const snapshot =
      themeId === "christ"
        ? await buildChristThemeSnapshot(sermons)
        : await buildPrepCardSnapshot(sermons);
    const written = new Set(snapshot.sermonIds);
    if (
      written.size !== sermons.length ||
      sermons.some((sermon) => !written.has(sermon.id))
    ) {
      throw new Error("Report did not record the selected sermons.");
    }
    const row = await insertPrepCard(user.id, snapshot);
    revalidatePath("/dashboard/deep-dive");
    revalidatePath("/dashboard/ask-theme");
    revalidatePath("/dashboard/christ-theme");
    revalidatePath("/dashboard/prep-card");
    const base =
      themeId === "christ" ? "/dashboard/christ-theme" : "/dashboard/ask-theme";
    return { ok: true, href: `${base}?id=${encodeURIComponent(row.id)}` };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Deep dive generation failed";
    console.error("[deep_dive]", message);
    return { ok: false, error: message };
  }
}
