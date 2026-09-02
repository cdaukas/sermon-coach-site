import type { SupabaseClient } from "@supabase/supabase-js";
import { tuesdayNudgeFirstName } from "@/lib/email/tuesday-nudge-template";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Always skip. Marketing/notifications inbox, not a preacher. */
const HARDCODED_EXCLUDED_EMAILS = new Set(["notifications@korper.nl"]);

/**
 * Chris's test account. It is empty on purpose and would otherwise be
 * dropped by the 14-day zero-sermon/zero-eval inactivity filter.
 */
const EMPTY_ACCOUNT_EXCEPTIONS = new Set(["cdaukas+sketchtest@gmail.com"]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const TUESDAY_NUDGE_MIN_AGE_MS = 7 * MS_PER_DAY;
export const TUESDAY_NUDGE_EVAL_SUPPRESS_MS = 3 * MS_PER_DAY;
export const TUESDAY_NUDGE_INACTIVE_MS = 14 * MS_PER_DAY;

export type TuesdayNudgeSkipReason =
  | "excluded"
  | "younger_than_7_days"
  | "eval_within_3_days"
  | "already_sent_this_week"
  | "empty_inactive";

export type TuesdayNudgeCandidate = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  lastEvaluationAt: string | null;
  lastSentAt: string | null;
  sermonCount: number;
  evaluationCount: number;
  recentCompleteEvalAt: string | null;
};

export type TuesdayNudgeDecision =
  | { action: "send"; firstName: string | null }
  | { action: "skip"; reason: TuesdayNudgeSkipReason };

export function startOfUtcIsoWeek(now: Date): Date {
  const day = now.getUTCDay();
  const isoOffset = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - isoOffset),
  );
}

export function isHardcodedExcludedEmail(email: string): boolean {
  return HARDCODED_EXCLUDED_EMAILS.has(normalizeEmail(email));
}

export function isEmptyAccountException(email: string): boolean {
  return EMPTY_ACCOUNT_EXCEPTIONS.has(normalizeEmail(email));
}

function latestActivityMs(candidate: TuesdayNudgeCandidate): number {
  const stamps = [
    candidate.createdAt,
    candidate.lastSignInAt,
    candidate.lastEvaluationAt,
    candidate.recentCompleteEvalAt,
  ];
  let latest = 0;
  for (const stamp of stamps) {
    if (!stamp) continue;
    const ms = Date.parse(stamp);
    if (Number.isFinite(ms) && ms > latest) {
      latest = ms;
    }
  }
  return latest;
}

export function isEmptyInactiveAccount(
  candidate: TuesdayNudgeCandidate,
  nowMs: number,
): boolean {
  if (candidate.sermonCount > 0 || candidate.evaluationCount > 0) {
    return false;
  }
  const lastActivity = latestActivityMs(candidate);
  if (lastActivity === 0) {
    return true;
  }
  return nowMs - lastActivity >= TUESDAY_NUDGE_INACTIVE_MS;
}

export function classifyTuesdayNudgeRecipient(
  candidate: TuesdayNudgeCandidate,
  now: Date,
): TuesdayNudgeDecision {
  const nowMs = now.getTime();

  if (isHardcodedExcludedEmail(candidate.email)) {
    return { action: "skip", reason: "excluded" };
  }

  const createdMs = Date.parse(candidate.createdAt);
  if (Number.isFinite(createdMs) && nowMs - createdMs < TUESDAY_NUDGE_MIN_AGE_MS) {
    return { action: "skip", reason: "younger_than_7_days" };
  }

  const recentEval = candidate.recentCompleteEvalAt ?? candidate.lastEvaluationAt;
  if (recentEval) {
    const evalMs = Date.parse(recentEval);
    if (Number.isFinite(evalMs) && nowMs - evalMs < TUESDAY_NUDGE_EVAL_SUPPRESS_MS) {
      return { action: "skip", reason: "eval_within_3_days" };
    }
  }

  if (candidate.lastSentAt) {
    const sentMs = Date.parse(candidate.lastSentAt);
    const weekStart = startOfUtcIsoWeek(now).getTime();
    if (Number.isFinite(sentMs) && sentMs >= weekStart) {
      return { action: "skip", reason: "already_sent_this_week" };
    }
  }

  if (
    isEmptyInactiveAccount(candidate, nowMs) &&
    !isEmptyAccountException(candidate.email)
  ) {
    return { action: "skip", reason: "empty_inactive" };
  }

  return {
    action: "send",
    firstName: tuesdayNudgeFirstName(candidate.displayName),
  };
}

type ProfileRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  last_evaluation_at: string | null;
  tuesday_nudge_last_sent_at: string | null;
};

async function listAuthUsers(
  supabase: SupabaseClient,
): Promise<Array<{
  id: string;
  email: string | null;
  last_sign_in_at: string | null;
}>> {
  const rows: Array<{
    id: string;
    email: string | null;
    last_sign_in_at: string | null;
  }> = [];
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
    for (const user of data.users) {
      rows.push({
        id: user.id,
        email: user.email ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return rows;
}

export type TuesdayNudgePlan = {
  send: Array<TuesdayNudgeCandidate & { firstName: string | null }>;
  skipped: Array<TuesdayNudgeCandidate & { reason: TuesdayNudgeSkipReason }>;
  emptyInactiveCaught: TuesdayNudgeCandidate[];
};

export async function planTuesdayNudgeRecipients(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<TuesdayNudgePlan> {
  const withStamp = await supabase
    .from("profiles")
    .select(
      "id, display_name, created_at, last_evaluation_at, tuesday_nudge_last_sent_at",
    )
    .eq("tuesday_nudge_opted_in", true);

  let optedIn: ProfileRow[] = [];

  if (withStamp.error?.message.includes("tuesday_nudge_last_sent_at")) {
    const withoutStamp = await supabase
      .from("profiles")
      .select("id, display_name, created_at, last_evaluation_at")
      .eq("tuesday_nudge_opted_in", true);
    if (withoutStamp.error) {
      throw new Error(`profiles query failed: ${withoutStamp.error.message}`);
    }
    optedIn = (withoutStamp.data ?? []).map((row) => ({
      ...row,
      tuesday_nudge_last_sent_at: null,
    }));
  } else if (withStamp.error) {
    throw new Error(`profiles query failed: ${withStamp.error.message}`);
  } else {
    optedIn = (withStamp.data ?? []) as ProfileRow[];
  }
  const ids = optedIn.map((row) => row.id);
  const sermonCount = new Map<string, number>();
  const evaluationCount = new Map<string, number>();
  const recentCompleteEvalAt = new Map<string, string>();
  const cutoff3d = new Date(now.getTime() - TUESDAY_NUDGE_EVAL_SUPPRESS_MS).toISOString();

  if (ids.length > 0) {
    const { data: sermons, error: sermonError } = await supabase
      .from("sermons")
      .select("id, user_id")
      .in("user_id", ids);
    if (sermonError) {
      throw new Error(`sermons query failed: ${sermonError.message}`);
    }

    const sermonToUser = new Map<string, string>();
    for (const sermon of sermons ?? []) {
      if (typeof sermon.id !== "string" || typeof sermon.user_id !== "string") {
        continue;
      }
      sermonToUser.set(sermon.id, sermon.user_id);
      sermonCount.set(sermon.user_id, (sermonCount.get(sermon.user_id) ?? 0) + 1);
    }

    const sermonIds = [...sermonToUser.keys()];
    if (sermonIds.length > 0) {
      const { data: versions, error: versionError } = await supabase
        .from("sermon_versions")
        .select("id, sermon_id")
        .in("sermon_id", sermonIds);
      if (versionError) {
        throw new Error(`sermon_versions query failed: ${versionError.message}`);
      }

      const versionToUser = new Map<string, string>();
      for (const version of versions ?? []) {
        if (typeof version.id !== "string" || typeof version.sermon_id !== "string") {
          continue;
        }
        const userId = sermonToUser.get(version.sermon_id);
        if (userId) {
          versionToUser.set(version.id, userId);
        }
      }

      const versionIds = [...versionToUser.keys()];
      if (versionIds.length > 0) {
        const { data: evals, error: evalError } = await supabase
          .from("sermon_evaluations")
          .select("sermon_version_id, created_at, status")
          .in("sermon_version_id", versionIds);
        if (evalError) {
          throw new Error(`sermon_evaluations query failed: ${evalError.message}`);
        }

        for (const row of evals ?? []) {
          if (typeof row.sermon_version_id !== "string") continue;
          const userId = versionToUser.get(row.sermon_version_id);
          if (!userId) continue;
          evaluationCount.set(userId, (evaluationCount.get(userId) ?? 0) + 1);
          if (row.status === "complete" && typeof row.created_at === "string") {
            if (row.created_at >= cutoff3d) {
              const prev = recentCompleteEvalAt.get(userId);
              if (!prev || row.created_at > prev) {
                recentCompleteEvalAt.set(userId, row.created_at);
              }
            }
          }
        }
      }
    }
  }

  const authUsers = await listAuthUsers(supabase);
  const authById = new Map(authUsers.map((user) => [user.id, user]));

  const send: TuesdayNudgePlan["send"] = [];
  const skipped: TuesdayNudgePlan["skipped"] = [];
  const emptyInactiveCaught: TuesdayNudgeCandidate[] = [];

  for (const profile of optedIn) {
    const auth = authById.get(profile.id);
    const email = auth?.email?.trim() ?? "";
    if (!email) {
      continue;
    }

    const candidate: TuesdayNudgeCandidate = {
      id: profile.id,
      email,
      displayName: profile.display_name,
      createdAt: profile.created_at,
      lastSignInAt: auth?.last_sign_in_at ?? null,
      lastEvaluationAt: profile.last_evaluation_at,
      lastSentAt: profile.tuesday_nudge_last_sent_at ?? null,
      sermonCount: sermonCount.get(profile.id) ?? 0,
      evaluationCount: evaluationCount.get(profile.id) ?? 0,
      recentCompleteEvalAt: recentCompleteEvalAt.get(profile.id) ?? null,
    };

    if (isEmptyInactiveAccount(candidate, now.getTime())) {
      emptyInactiveCaught.push(candidate);
    }

    const decision = classifyTuesdayNudgeRecipient(candidate, now);
    if (decision.action === "send") {
      send.push({ ...candidate, firstName: decision.firstName });
    } else {
      skipped.push({ ...candidate, reason: decision.reason });
    }
  }

  send.sort((a, b) => a.email.localeCompare(b.email));
  skipped.sort((a, b) => a.email.localeCompare(b.email));
  emptyInactiveCaught.sort((a, b) => a.email.localeCompare(b.email));

  return { send, skipped, emptyInactiveCaught };
}
