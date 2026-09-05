/** Soft-deleted sermon hard-purge helpers for the daily cron. */

export const SERMON_PURGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const ARCHIVE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type PurgeEvaluationLike = {
  id: string;
  status: string;
  is_public_sample?: boolean | null;
  mentor_relationship_id?: string | null;
};

export type SkipGuardReason =
  | "is_public_sample"
  | "mentor_relationship_id"
  | "pending_or_processing";

export type SkipGuardResult =
  | { skip: false }
  | { skip: true; reasons: SkipGuardReason[]; evaluationIds: string[] };

export type ArchiveRowInput = {
  archived_at: string;
  reason: string;
  source_table: string;
  row_data: Record<string, unknown>;
};

/** Report-only unless the env value is literally the string "false". */
export function isSermonPurgeDryRun(
  value: string | undefined = process.env.SERMON_PURGE_DRY_RUN,
): boolean {
  return value !== "false";
}

export function purgeEligibilityCutoffIso(nowMs: number = Date.now()): string {
  return new Date(nowMs - SERMON_PURGE_RETENTION_MS).toISOString();
}

export function archiveSweepCutoffIso(nowMs: number = Date.now()): string {
  return new Date(nowMs - ARCHIVE_RETENTION_MS).toISOString();
}

export function purgeReasonTag(now: Date = new Date()): string {
  return `purge ${now.toISOString().slice(0, 10)}`;
}

/**
 * Skip when any evaluation under the sermon trips a guard.
 * Permanent skip until the guard clears; caller re-selects each run.
 */
export function evaluatePurgeSkipGuards(
  evaluations: readonly PurgeEvaluationLike[],
): SkipGuardResult {
  const reasons = new Set<SkipGuardReason>();
  const evaluationIds: string[] = [];

  for (const evaluation of evaluations) {
    const tripped: SkipGuardReason[] = [];
    if (evaluation.is_public_sample === true) {
      tripped.push("is_public_sample");
    }
    if (evaluation.mentor_relationship_id != null) {
      tripped.push("mentor_relationship_id");
    }
    if (
      evaluation.status === "pending" ||
      evaluation.status === "processing"
    ) {
      tripped.push("pending_or_processing");
    }
    if (tripped.length === 0) {
      continue;
    }
    evaluationIds.push(evaluation.id);
    for (const reason of tripped) {
      reasons.add(reason);
    }
  }

  if (reasons.size === 0) {
    return { skip: false };
  }
  return {
    skip: true,
    reasons: [...reasons],
    evaluationIds,
  };
}

export function buildArchiveRows(params: {
  reason: string;
  archivedAt: string;
  evaluations: readonly Record<string, unknown>[];
  versions: readonly Record<string, unknown>[];
  sermon: Record<string, unknown>;
}): ArchiveRowInput[] {
  const rows: ArchiveRowInput[] = [];
  for (const row of params.evaluations) {
    rows.push({
      archived_at: params.archivedAt,
      reason: params.reason,
      source_table: "sermon_evaluations",
      row_data: row,
    });
  }
  for (const row of params.versions) {
    rows.push({
      archived_at: params.archivedAt,
      reason: params.reason,
      source_table: "sermon_versions",
      row_data: row,
    });
  }
  rows.push({
    archived_at: params.archivedAt,
    reason: params.reason,
    source_table: "sermons",
    row_data: params.sermon,
  });
  return rows;
}

export function expectedArchiveCounts(params: {
  evaluationCount: number;
  versionCount: number;
}): { evaluations: number; versions: number; sermons: number; total: number } {
  const evaluations = params.evaluationCount;
  const versions = params.versionCount;
  const sermons = 1;
  return {
    evaluations,
    versions,
    sermons,
    total: evaluations + versions + sermons,
  };
}

export function countArchiveInsertsBySourceTable(
  rows: readonly { source_table?: string | null }[],
): { evaluations: number; versions: number; sermons: number; total: number } {
  let evaluations = 0;
  let versions = 0;
  let sermons = 0;
  for (const row of rows) {
    if (row.source_table === "sermon_evaluations") {
      evaluations += 1;
    } else if (row.source_table === "sermon_versions") {
      versions += 1;
    } else if (row.source_table === "sermons") {
      sermons += 1;
    }
  }
  return {
    evaluations,
    versions,
    sermons,
    total: evaluations + versions + sermons,
  };
}

export function archiveCountsMatch(
  expected: ReturnType<typeof expectedArchiveCounts>,
  actual: ReturnType<typeof countArchiveInsertsBySourceTable>,
): boolean {
  return (
    expected.evaluations === actual.evaluations &&
    expected.versions === actual.versions &&
    expected.sermons === actual.sermons &&
    expected.total === actual.total
  );
}
