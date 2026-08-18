import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseUnverifiedPurgeAllowlist,
  selectUnverifiedPurgeCandidates,
  type AuthUserLike,
} from "@/lib/auth/purge-unverified";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function isDryRun(): boolean {
  return process.env.PURGE_UNVERIFIED_DRY_RUN !== "false";
}

async function listAuthUsers(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<AuthUserLike[]> {
  const rows: AuthUserLike[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    }
    for (const authUser of data.users) {
      rows.push({
        id: authUser.id,
        email: authUser.email ?? null,
        email_confirmed_at: authUser.email_confirmed_at ?? null,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
        created_at: authUser.created_at,
      });
    }
    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return unauthorized();
  }

  try {
    const dryRun = isDryRun();
    const supabase = createAdminClient();
    const allowlist = parseUnverifiedPurgeAllowlist(
      process.env.PURGE_UNVERIFIED_ALLOWLIST,
    );
    const users = await listAuthUsers(supabase);
    const selected = selectUnverifiedPurgeCandidates(users, { allowlist });

    const candidateIds = selected.candidates.map((row) => row.id);
    const protectedIds = new Set<string>();

    if (candidateIds.length > 0) {
      const { data: sermonRows, error: sermonError } = await supabase
        .from("sermons")
        .select("user_id")
        .in("user_id", candidateIds);

      if (sermonError) {
        throw new Error(`sermons lookup failed: ${sermonError.message}`);
      }
      for (const row of sermonRows ?? []) {
        if (typeof row.user_id === "string") {
          protectedIds.add(row.user_id);
        }
      }
    }

    const toDelete = selected.candidates.filter((row) => !protectedIds.has(row.id));
    const skippedHasSermons = selected.candidates.filter((row) =>
      protectedIds.has(row.id),
    );

    const deleted: Array<{ id: string; email: string | null }> = [];
    const deleteErrors: Array<{ id: string; error: string }> = [];

    if (!dryRun) {
      for (const row of toDelete) {
        const { error } = await supabase.auth.admin.deleteUser(row.id);
        if (error) {
          deleteErrors.push({ id: row.id, error: error.message });
          continue;
        }
        deleted.push({ id: row.id, email: row.email ?? null });
      }
    }

    const summary = {
      tag: "purge_unverified_users",
      dry_run: dryRun,
      stale_candidates: toDelete.map((row) => ({
        id: row.id,
        email: row.email ?? null,
        created_at: row.created_at,
      })),
      skipped_allowlist: selected.skippedAllowlist.map((row) => ({
        id: row.id,
        email: row.email ?? null,
      })),
      skipped_has_sermons: skippedHasSermons.map((row) => ({
        id: row.id,
        email: row.email ?? null,
      })),
      deleted,
      delete_errors: deleteErrors,
    };

    console.log(JSON.stringify(summary));
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "purge failed";
    console.error("[purge_unverified_users]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
