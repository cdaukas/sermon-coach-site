import { createClient } from "@/lib/supabase/server";
import { themeDisplayName, type MovementThemeId } from "@/lib/movement/themes";
import type { MovementReportSnapshot } from "@/lib/movement/types";
import type { PrepCardRow, PrepCardSnapshot } from "./types";

export type DeepDiveHistoryEntry = {
  id: string;
  kind: "diagnostic" | "movement";
  /** Display label before the date. */
  label: string;
  href: string;
  generatedAt: string;
};

function isDeskCard(snapshot: PrepCardSnapshot): boolean {
  return snapshot.themeId === "desk";
}

function diagnosticLabel(snapshot: PrepCardSnapshot): string {
  return snapshot.themeId === "christ"
    ? "Christ in the sermon"
    : "The ask";
}

function diagnosticHref(snapshot: PrepCardSnapshot, id: string): string {
  const base =
    snapshot.themeId === "christ"
      ? "/dashboard/christ-theme"
      : "/dashboard/ask-theme";
  return `${base}?id=${encodeURIComponent(id)}`;
}

function mapPrepRow(row: Record<string, unknown>): PrepCardRow {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    generated_at: row.generated_at as string,
    sample_size: row.sample_size as number,
    source_format: row.source_format as PrepCardRow["source_format"],
    ranked_measure_count: row.ranked_measure_count as number,
    pool_note: row.pool_note as string,
    snapshot: row.snapshot as PrepCardSnapshot,
    created_at: row.created_at as string,
  };
}

/**
 * Theme diagnostics + movement reports, newest first.
 * Desk prep cards are excluded. Movement table missing → diagnostics only.
 */
export async function listDeepDiveHistory(
  userId: string,
  limit = 40,
): Promise<DeepDiveHistoryEntry[]> {
  const supabase = await createClient();
  const entries: DeepDiveHistoryEntry[] = [];

  const { data: cards, error: cardsError } = await supabase
    .from("prep_cards")
    .select(
      "id, user_id, generated_at, sample_size, source_format, ranked_measure_count, pool_note, snapshot, created_at",
    )
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  for (const raw of cards ?? []) {
    const row = mapPrepRow(raw);
    if (isDeskCard(row.snapshot)) {
      continue;
    }
    entries.push({
      id: row.id,
      kind: "diagnostic",
      label: diagnosticLabel(row.snapshot),
      href: diagnosticHref(row.snapshot, row.id),
      generatedAt: row.snapshot.generatedAt || row.generated_at,
    });
  }

  try {
    const { data: movements, error: movementError } = await supabase
      .from("movement_reports")
      .select("id, generated_at, theme_id, snapshot")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (movementError) {
      console.warn(
        "[deep_dive_history] movement_reports unavailable",
        movementError.message,
      );
    } else {
      for (const row of movements ?? []) {
        const snapshot = row.snapshot as MovementReportSnapshot | null;
        const themeId = (row.theme_id ??
          snapshot?.themeId ??
          "ask") as MovementThemeId;
        const generatedAt =
          (typeof snapshot?.generatedAt === "string" && snapshot.generatedAt) ||
          (row.generated_at as string);
        entries.push({
          id: row.id as string,
          kind: "movement",
          label: `Movement · ${themeDisplayName(themeId)}`,
          href: `/dashboard/movement?id=${encodeURIComponent(row.id as string)}`,
          generatedAt,
        });
      }
    }
  } catch (error) {
    console.warn(
      "[deep_dive_history] movement list failed",
      error instanceof Error ? error.message : error,
    );
  }

  entries.sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
  return entries.slice(0, limit);
}

/** Load a frozen diagnostic by id. Desk cards rejected. */
export async function getThemeDiagnosticById(
  userId: string,
  id: string,
): Promise<PrepCardRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_cards")
    .select(
      "id, user_id, generated_at, sample_size, source_format, ranked_measure_count, pool_note, snapshot, created_at",
    )
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  const row = mapPrepRow(data);
  if (isDeskCard(row.snapshot)) {
    return null;
  }
  return row;
}

export async function getMovementReportById(
  userId: string,
  id: string,
): Promise<{
  id: string;
  baselineId: string;
  generatedAt: string;
  snapshot: MovementReportSnapshot;
} | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("movement_reports")
      .select("id, baseline_id, generated_at, snapshot")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn(
        "[deep_dive_history] movement by id failed",
        error.message,
      );
      return null;
    }
    if (!data) {
      return null;
    }
    const snapshot = data.snapshot as MovementReportSnapshot;
    return {
      id: data.id as string,
      baselineId: data.baseline_id as string,
      generatedAt:
        (typeof snapshot?.generatedAt === "string" && snapshot.generatedAt) ||
        (data.generated_at as string),
      snapshot,
    };
  } catch (error) {
    console.warn(
      "[deep_dive_history] movement by id failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function formatDeepDiveHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
