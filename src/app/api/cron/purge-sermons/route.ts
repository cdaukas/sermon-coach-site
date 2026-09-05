import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  archiveSweepCutoffIso,
  evaluatePurgeSkipGuards,
  expectedArchiveCounts,
  isSermonPurgeDryRun,
  purgeEligibilityCutoffIso,
  purgeReasonTag,
  type PurgeEvaluationLike,
} from "@/lib/sermons/purge-sermons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

type SermonRow = Record<string, unknown> & {
  id: string;
  user_id: string;
  title: string | null;
  deleted_at: string;
};

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function logPurge(event: string, payload: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      tag: "sermon_purge",
      event,
      ...payload,
    }),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

async function resolveOwnerEmail(
  supabase: AdminClient,
  userId: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  if (cache.has(userId)) {
    return cache.get(userId) ?? null;
  }
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    logPurge("owner_email_lookup_failed", {
      user_id: userId,
      error: error.message,
    });
    cache.set(userId, null);
    return null;
  }
  const email = data.user?.email ?? null;
  cache.set(userId, email);
  return email;
}

async function loadEligibleSermons(
  supabase: AdminClient,
  cutoffIso: string,
): Promise<SermonRow[]> {
  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoffIso)
    .order("deleted_at", { ascending: true });

  if (error) {
    throw new Error(`eligible sermons lookup failed: ${error.message}`);
  }

  const rows: SermonRow[] = [];
  for (const raw of data ?? []) {
    const row = asRecord(raw);
    if (!row || typeof row.id !== "string" || typeof row.user_id !== "string") {
      continue;
    }
    if (typeof row.deleted_at !== "string") {
      continue;
    }
    rows.push({
      ...row,
      id: row.id,
      user_id: row.user_id,
      title: typeof row.title === "string" ? row.title : null,
      deleted_at: row.deleted_at,
    });
  }
  return rows;
}

async function loadVersions(
  supabase: AdminClient,
  sermonId: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("sermon_versions")
    .select("*")
    .eq("sermon_id", sermonId);

  if (error) {
    throw new Error(
      `sermon_versions lookup failed for ${sermonId}: ${error.message}`,
    );
  }
  return (data ?? [])
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => row !== null);
}

async function loadEvaluations(
  supabase: AdminClient,
  versionIds: string[],
): Promise<Record<string, unknown>[]> {
  if (versionIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("sermon_evaluations")
    .select("*")
    .in("sermon_version_id", versionIds);

  if (error) {
    throw new Error(`sermon_evaluations lookup failed: ${error.message}`);
  }
  return (data ?? [])
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => row !== null);
}

function toPurgeEvaluationLike(
  row: Record<string, unknown>,
): PurgeEvaluationLike | null {
  if (typeof row.id !== "string" || typeof row.status !== "string") {
    return null;
  }
  return {
    id: row.id,
    status: row.status,
    is_public_sample:
      typeof row.is_public_sample === "boolean" ? row.is_public_sample : null,
    mentor_relationship_id:
      row.mentor_relationship_id == null
        ? null
        : String(row.mentor_relationship_id),
  };
}

type PurgeSoftDeletedResult = {
  sermon_id: string;
  owner_id: string;
  title: string | null;
  deleted_at: string;
  reason: string;
  evaluation_count: number;
  version_count: number;
  evaluation_ids: string[];
  version_ids: string[];
  readiness_reads_cleared: string[];
};

function parseUuidArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function parsePurgeSoftDeletedResult(
  value: unknown,
): PurgeSoftDeletedResult {
  const row = asRecord(value);
  if (!row || typeof row.sermon_id !== "string") {
    throw new Error("purge_soft_deleted_sermon returned an invalid payload");
  }
  return {
    sermon_id: row.sermon_id,
    owner_id: typeof row.owner_id === "string" ? row.owner_id : "",
    title: typeof row.title === "string" ? row.title : null,
    deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : "",
    reason: typeof row.reason === "string" ? row.reason : "",
    evaluation_count:
      typeof row.evaluation_count === "number" ? row.evaluation_count : 0,
    version_count:
      typeof row.version_count === "number" ? row.version_count : 0,
    evaluation_ids: parseUuidArray(row.evaluation_ids),
    version_ids: parseUuidArray(row.version_ids),
    readiness_reads_cleared: parseUuidArray(row.readiness_reads_cleared),
  };
}

/**
 * Entire write path for one sermon: archive, count-verify, readiness null,
 * and deletes — all inside purge_soft_deleted_sermon (one Postgres transaction).
 */
async function destroySermonTree(
  supabase: AdminClient,
  sermonId: string,
  reason: string,
): Promise<PurgeSoftDeletedResult> {
  const { data, error } = await supabase.rpc("purge_soft_deleted_sermon", {
    p_sermon_id: sermonId,
    p_reason: reason,
  });
  if (error) {
    throw new Error(`purge_soft_deleted_sermon failed: ${error.message}`);
  }
  return parsePurgeSoftDeletedResult(data);
}

async function sweepExpiredArchive(
  supabase: AdminClient,
  cutoffIso: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("purge_sermon_archive_sweep", {
    p_older_than: cutoffIso,
  });
  if (error) {
    throw new Error(`purge_sermon_archive_sweep failed: ${error.message}`);
  }
  const row = asRecord(data);
  const deleted =
    row && typeof row.deleted_count === "number" ? row.deleted_count : 0;
  return deleted;
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return unauthorized();
  }

  const dryRun = isSermonPurgeDryRun();
  const now = new Date();
  const eligibilityCutoff = purgeEligibilityCutoffIso(now.getTime());
  const archiveCutoff = archiveSweepCutoffIso(now.getTime());
  const reason = purgeReasonTag(now);

  const summary = {
    tag: "sermon_purge",
    dry_run: dryRun,
    eligibility_cutoff: eligibilityCutoff,
    archive_sweep_cutoff: archiveCutoff,
    reason,
    selected: [] as Array<Record<string, unknown>>,
    skipped: [] as Array<Record<string, unknown>>,
    purged: [] as Array<Record<string, unknown>>,
    aborted: [] as Array<Record<string, unknown>>,
    archive_sweep_expired_count: null as number | null,
    archive_sweep_skipped: null as string | null,
  };

  try {
    const supabase = createAdminClient();
    const ownerEmailCache = new Map<string, string | null>();
    const eligible = await loadEligibleSermons(supabase, eligibilityCutoff);

    for (const sermon of eligible) {
      const ownerEmail = await resolveOwnerEmail(
        supabase,
        sermon.user_id,
        ownerEmailCache,
      );
      const baseLog = {
        sermon_id: sermon.id,
        owner_id: sermon.user_id,
        owner_email: ownerEmail,
        title: sermon.title,
        deleted_at: sermon.deleted_at,
      };

      try {
        const versions = await loadVersions(supabase, sermon.id);
        const versionIds = versions
          .map((row) => row.id)
          .filter((id): id is string => typeof id === "string");
        const evaluations = await loadEvaluations(supabase, versionIds);
        const evaluationLikes = evaluations
          .map(toPurgeEvaluationLike)
          .filter((row): row is PurgeEvaluationLike => row !== null);

        const guard = evaluatePurgeSkipGuards(evaluationLikes);
        const counts = {
          versions: versions.length,
          evaluations: evaluations.length,
        };

        summary.selected.push({
          ...baseLog,
          ...counts,
        });

        if (guard.skip) {
          const skipPayload = {
            ...baseLog,
            ...counts,
            reasons: guard.reasons,
            evaluation_ids: guard.evaluationIds,
          };
          summary.skipped.push(skipPayload);
          logPurge("skip", skipPayload);
          continue;
        }

        const expected = expectedArchiveCounts({
          evaluationCount: evaluations.length,
          versionCount: versions.length,
        });

        if (dryRun) {
          const { data: linkedReads, error: linkedError } = await supabase
            .from("readiness_reads")
            .select("id")
            .eq("sermon_id", sermon.id);
          if (linkedError) {
            throw new Error(
              `readiness_reads lookup failed for ${sermon.id}: ${linkedError.message}`,
            );
          }
          const readinessIds = (linkedReads ?? [])
            .map((row) => asRecord(row)?.id)
            .filter((id): id is string => typeof id === "string");

          const wouldPurge = {
            ...baseLog,
            ...counts,
            readiness_reads_cleared: readinessIds,
            archive_expected: expected,
          };
          summary.purged.push(wouldPurge);
          logPurge("would_purge", wouldPurge);
          continue;
        }

        const purged = await destroySermonTree(supabase, sermon.id, reason);

        for (const readinessId of purged.readiness_reads_cleared) {
          logPurge("readiness_read_cleared", {
            readiness_read_id: readinessId,
            sermon_id: sermon.id,
          });
        }

        const purgedPayload = {
          ...baseLog,
          versions: purged.version_count,
          evaluations: purged.evaluation_count,
          readiness_reads_cleared: purged.readiness_reads_cleared,
          archive_expected: expected,
        };
        summary.purged.push(purgedPayload);
        logPurge("purged", purgedPayload);
      } catch (error) {
        const message = error instanceof Error ? error.message : "purge failed";
        const abortPayload = {
          ...baseLog,
          error: message,
        };
        summary.aborted.push(abortPayload);
        logPurge("abort_error", abortPayload);
      }
    }

    if (dryRun) {
      summary.archive_sweep_skipped = "SERMON_PURGE_DRY_RUN";
      logPurge("archive_sweep_skipped", {
        reason: "SERMON_PURGE_DRY_RUN",
        cutoff: archiveCutoff,
      });
    } else {
      try {
        summary.archive_sweep_expired_count = await sweepExpiredArchive(
          supabase,
          archiveCutoff,
        );
        logPurge("archive_sweep", {
          expired_count: summary.archive_sweep_expired_count,
          cutoff: archiveCutoff,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "archive sweep failed";
        logPurge("archive_sweep_error", {
          error: message,
          cutoff: archiveCutoff,
        });
      }
    }

    logPurge("summary", summary);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "purge failed";
    console.error("[sermon_purge]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
