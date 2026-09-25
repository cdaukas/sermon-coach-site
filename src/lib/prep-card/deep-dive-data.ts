import { createClient } from "@/lib/supabase/server";
import type { PrepSermonInput } from "./build";
import {
  deepDiveThemeLabel,
  type DeepDiveSermonOption,
  type DeepDiveThemeId,
} from "./deep-dive-dashboard";
import { genreForPassage } from "./genre";
import { detectPrepSourceFormat } from "./text";
import type { PrepCardSnapshot } from "./types";

export type { DeepDiveSermonOption };

export type DeepDiveThemeRun = {
  themeId: DeepDiveThemeId;
  label: string;
  generatedAt: string;
};

/**
 * Non-deleted sermons that have text. This is the set the picker offers
 * and the set the unlock bar counts. `excluded_from_growth` is a chart
 * flag, not an eligibility flag.
 */
export async function listEligibleDeepDiveSermons(
  userId: string,
): Promise<DeepDiveSermonOption[]> {
  const supabase = await createClient();
  const { data: sermons, error } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`deep dive sermons: ${error.message}`);
  }
  if (!sermons || sermons.length === 0) {
    return [];
  }

  const contentById = await latestContentBySermon(
    sermons.map((row) => row.id as string),
  );

  const options: DeepDiveSermonOption[] = [];
  for (const sermon of sermons) {
    const content = contentById.get(sermon.id as string);
    if (!content) {
      continue;
    }
    const passage =
      typeof sermon.primary_passage === "string" && sermon.primary_passage.trim()
        ? sermon.primary_passage.trim()
        : null;
    options.push({
      id: sermon.id as string,
      title: typeof sermon.title === "string" ? sermon.title : "Sermon",
      createdAt: sermon.created_at as string,
      passage,
      format: detectPrepSourceFormat(content),
      genre: genreForPassage(passage),
    });
  }
  return options;
}

/**
 * Load the preacher's own eligible sermons for a selection.
 * Oldest first, matching the existing counting order.
 * Returns null when any id is missing, deleted, or empty.
 */
export async function loadDeepDiveSermonsByIds(
  userId: string,
  sermonIds: readonly string[],
): Promise<PrepSermonInput[] | null> {
  const unique = [...new Set(sermonIds)];
  if (unique.length === 0) {
    return null;
  }

  const supabase = await createClient();
  const { data: sermons, error } = await supabase
    .from("sermons")
    .select("id, title, primary_passage, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("id", unique);

  if (error) {
    throw new Error(`deep dive selection: ${error.message}`);
  }
  if (!sermons || sermons.length !== unique.length) {
    return null;
  }

  const contentById = await latestContentBySermon(unique);
  const byId = new Map(sermons.map((row) => [row.id as string, row]));
  const ordered = [...sermons].sort((a, b) =>
    String(a.created_at).localeCompare(String(b.created_at)),
  );

  const loaded: PrepSermonInput[] = [];
  for (const sermon of ordered) {
    const content = contentById.get(sermon.id as string);
    if (!content || !byId.has(sermon.id as string)) {
      return null;
    }
    const passage = sermon.primary_passage;
    loaded.push({
      id: sermon.id as string,
      title: typeof sermon.title === "string" ? sermon.title : "Sermon",
      content,
      primaryPassage: typeof passage === "string" ? passage : null,
    });
  }
  return loaded;
}

async function latestContentBySermon(
  sermonIds: string[],
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data: versions, error } = await supabase
    .from("sermon_versions")
    .select("sermon_id, content, created_at")
    .in("sermon_id", sermonIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`deep dive versions: ${error.message}`);
  }

  const latest = new Map<string, string>();
  for (const version of versions ?? []) {
    const sermonId = version.sermon_id as string;
    if (latest.has(sermonId)) {
      continue;
    }
    if (typeof version.content === "string" && version.content.trim()) {
      latest.set(sermonId, version.content);
    }
  }
  return latest;
}

function themeIdFromSnapshot(
  snapshot: PrepCardSnapshot,
): DeepDiveThemeId | null {
  if (snapshot.themeId === "desk") {
    return null;
  }
  if (snapshot.themeId === "christ") {
    return "christ";
  }
  return "ask";
}

/**
 * Latest ask/christ diagnostic, plus the last run of each theme.
 * Desk cards and movement reports are not included. The quarter is the
 * latest diagnostic's generated_at; there is no separate cap column.
 */
export async function loadDeepDiveRuns(userId: string): Promise<{
  latest: DeepDiveThemeRun | null;
  lastRunAt: Record<DeepDiveThemeId, string | null>;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_cards")
    .select("generated_at, snapshot")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  const lastRunAt: Record<DeepDiveThemeId, string | null> = {
    ask: null,
    christ: null,
  };
  let latest: DeepDiveThemeRun | null = null;

  for (const row of data ?? []) {
    const snapshot = row.snapshot as PrepCardSnapshot;
    const themeId = themeIdFromSnapshot(snapshot);
    if (!themeId) {
      continue;
    }
    const generatedAt = row.generated_at as string;
    if (!latest) {
      latest = {
        themeId,
        label: deepDiveThemeLabel(themeId),
        generatedAt,
      };
    }
    if (!lastRunAt[themeId]) {
      lastRunAt[themeId] = generatedAt;
    }
  }

  return { latest, lastRunAt };
}
