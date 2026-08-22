export const OPERATOR_DIGEST_TO = "cdaukas@gmail.com";

export const QUIET_DAYS = 21;
export const NEVER_ACTIVATED_MIN_DAYS = 7;
export const NEVER_ACTIVATED_MAX_DAYS = 30;
export const CREDITS_AT_RISK_DAYS = 60;
export const RENEWAL_DAYS = 14;
export const LIST_TRUNCATE = 10;

const PHOENIX_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Phoenix",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type DigestProfile = {
  id: string;
  display_name: string | null;
  normalized_email: string | null;
  plan_tier: string;
  subscription_status: string | null;
  subscription_interval: string | null;
  current_period_end: string | null;
  last_evaluation_at: string | null;
  created_at: string;
};

export type DigestGrant = {
  user_id: string;
  quantity_remaining: number;
  expires_at: string | null;
};

export type DigestEval = {
  owner_id: string;
  created_at: string;
};

export type DigestAuthUser = {
  id: string;
  email_confirmed_at: string | null;
};

export type QuietSubscriberRow = {
  name: string;
  plan_tier: string;
  last_submitted: string;
  eval_count: number;
};

export type NeverActivatedRow = {
  name: string;
  signup_date: string;
  confirmed: string;
};

export type CreditAtRiskRow = {
  name: string;
  quantity_remaining: number;
  expires_at: string;
};

export type RenewalRow = {
  name: string;
  current_period_end: string;
  interval_label: string;
};

export type OperatorDigestLists = {
  quietSubscribers: QuietSubscriberRow[];
  neverActivated: NeverActivatedRow[];
  creditsAtRisk: CreditAtRiskRow[];
  renewals: RenewalRow[];
};

export type OperatorDigestHeader = {
  evaluationsLast7Days: number;
  evaluationsPrevious7Days: number;
  newAccountsLast7Days: number;
  accountsWithTwoOrMoreEvals: number;
};

export type OperatorDigest = {
  header: OperatorDigestHeader;
  lists: OperatorDigestLists;
  attentionCount: number;
};

export function operatorDisplayName(
  displayName: string | null | undefined,
  normalizedEmail: string | null | undefined,
): string {
  const name = displayName?.trim();
  if (name) {
    return name;
  }
  const email = normalizedEmail?.trim();
  if (email) {
    return email;
  }
  return "unknown";
}

export function formatDigestDate(iso: string | null | undefined): string {
  if (!iso) {
    return "never";
  }
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return "never";
  }
  return PHOENIX_DATE.format(new Date(ms));
}

export function formatIntervalLabel(interval: string | null | undefined): string {
  if (interval == null || interval.trim() === "") {
    return "interval unknown";
  }
  return interval.trim();
}

export function evalCountsByOwner(evals: DigestEval[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of evals) {
    counts.set(row.owner_id, (counts.get(row.owner_id) ?? 0) + 1);
  }
  return counts;
}

export function isQuietSubscriber(profile: DigestProfile, now: Date): boolean {
  if (profile.subscription_status !== "active") {
    return false;
  }
  if (!profile.last_evaluation_at) {
    return true;
  }
  const last = Date.parse(profile.last_evaluation_at);
  if (!Number.isFinite(last)) {
    return true;
  }
  return last <= now.getTime() - QUIET_DAYS * 24 * 60 * 60 * 1000;
}

export function isNeverActivated(
  profile: DigestProfile,
  evalCount: number,
  now: Date,
  emailConfirmedAt: string | null,
): boolean {
  if (!emailConfirmedAt) {
    return false;
  }
  if (evalCount > 0) {
    return false;
  }
  const created = Date.parse(profile.created_at);
  if (!Number.isFinite(created)) {
    return false;
  }
  const ageMs = now.getTime() - created;
  const minMs = NEVER_ACTIVATED_MIN_DAYS * 24 * 60 * 60 * 1000;
  const maxMs = NEVER_ACTIVATED_MAX_DAYS * 24 * 60 * 60 * 1000;
  return ageMs >= minMs && ageMs <= maxMs;
}

export function isRenewalDue(profile: DigestProfile, now: Date): boolean {
  if (profile.subscription_status !== "active") {
    return false;
  }
  if (profile.subscription_interval === "month") {
    return false;
  }
  if (!profile.current_period_end) {
    return false;
  }
  const end = Date.parse(profile.current_period_end);
  if (!Number.isFinite(end)) {
    return false;
  }
  const nowMs = now.getTime();
  const maxMs = nowMs + RENEWAL_DAYS * 24 * 60 * 60 * 1000;
  return end >= nowMs && end <= maxMs;
}

export function isCreditAtRisk(grant: DigestGrant, now: Date): boolean {
  if (grant.quantity_remaining <= 0) {
    return false;
  }
  if (!grant.expires_at) {
    return false;
  }
  const expires = Date.parse(grant.expires_at);
  if (!Number.isFinite(expires)) {
    return false;
  }
  const nowMs = now.getTime();
  const maxMs = nowMs + CREDITS_AT_RISK_DAYS * 24 * 60 * 60 * 1000;
  return expires >= nowMs && expires <= maxMs;
}

export function countEvalsInWindow(
  evals: DigestEval[],
  startInclusive: Date,
  endExclusive: Date,
): number {
  const start = startInclusive.getTime();
  const end = endExclusive.getTime();
  let count = 0;
  for (const row of evals) {
    const created = Date.parse(row.created_at);
    if (!Number.isFinite(created)) {
      continue;
    }
    if (created >= start && created < end) {
      count += 1;
    }
  }
  return count;
}

export function assembleOperatorDigest(input: {
  now: Date;
  profiles: DigestProfile[];
  evals: DigestEval[];
  grants: DigestGrant[];
  authUsers: DigestAuthUser[];
}): OperatorDigest {
  const { now, profiles, evals, grants, authUsers } = input;
  const counts = evalCountsByOwner(evals);
  const confirmedById = new Map(
    authUsers.map((user) => [user.id, user.email_confirmed_at] as const),
  );

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const header: OperatorDigestHeader = {
    evaluationsLast7Days: countEvalsInWindow(evals, sevenDaysAgo, now),
    evaluationsPrevious7Days: countEvalsInWindow(evals, fourteenDaysAgo, sevenDaysAgo),
    newAccountsLast7Days: profiles.filter((profile) => {
      const created = Date.parse(profile.created_at);
      return Number.isFinite(created) && created >= sevenDaysAgo.getTime();
    }).length,
    accountsWithTwoOrMoreEvals: [...counts.values()].filter((n) => n >= 2).length,
  };

  const quietSubscribers = profiles
    .filter((profile) => isQuietSubscriber(profile, now))
    .map((profile) => ({
      name: operatorDisplayName(profile.display_name, profile.normalized_email),
      plan_tier: profile.plan_tier,
      last_submitted: formatDigestDate(profile.last_evaluation_at),
      eval_count: counts.get(profile.id) ?? 0,
      lastMs: profile.last_evaluation_at
        ? Date.parse(profile.last_evaluation_at)
        : 0,
    }))
    .sort((a, b) => a.lastMs - b.lastMs)
    .map(({ lastMs: _lastMs, ...row }) => row);

  const neverActivated = profiles
    .filter((profile) =>
      isNeverActivated(
        profile,
        counts.get(profile.id) ?? 0,
        now,
        confirmedById.get(profile.id) ?? null,
      ),
    )
    .map((profile) => {
      const confirmedAt = confirmedById.get(profile.id) ?? null;
      return {
        name: operatorDisplayName(profile.display_name, profile.normalized_email),
        signup_date: formatDigestDate(profile.created_at),
        confirmed: confirmedAt ? formatDigestDate(confirmedAt) : "unconfirmed",
        createdMs: Date.parse(profile.created_at),
      };
    })
    .sort((a, b) => b.createdMs - a.createdMs)
    .map(({ createdMs: _createdMs, ...row }) => row);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const creditsAtRisk = grants
    .filter((grant) => isCreditAtRisk(grant, now))
    .map((grant) => {
      const profile = profileById.get(grant.user_id);
      return {
        name: operatorDisplayName(
          profile?.display_name,
          profile?.normalized_email,
        ),
        quantity_remaining: grant.quantity_remaining,
        expires_at: formatDigestDate(grant.expires_at),
        expiresMs: Date.parse(grant.expires_at ?? ""),
      };
    })
    .sort((a, b) => a.expiresMs - b.expiresMs)
    .map(({ expiresMs: _expiresMs, ...row }) => row);

  const renewals = profiles
    .filter((profile) => isRenewalDue(profile, now))
    .map((profile) => ({
      name: operatorDisplayName(profile.display_name, profile.normalized_email),
      current_period_end: formatDigestDate(profile.current_period_end),
      interval_label: formatIntervalLabel(profile.subscription_interval),
      endMs: Date.parse(profile.current_period_end ?? ""),
    }))
    .sort((a, b) => a.endMs - b.endMs)
    .map(({ endMs: _endMs, ...row }) => row);

  const lists: OperatorDigestLists = {
    quietSubscribers,
    neverActivated,
    creditsAtRisk,
    renewals,
  };

  return {
    header,
    lists,
    attentionCount:
      quietSubscribers.length +
      neverActivated.length +
      creditsAtRisk.length +
      renewals.length,
  };
}

export function digestSubject(attentionCount: number): string {
  if (attentionCount === 0) {
    return "Sermon Coach weekly: nothing to act on";
  }
  return `Sermon Coach weekly: ${attentionCount} need attention`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderListBlock(title: string, lines: string[]): string {
  const heading = `<h2>${escapeHtml(title)}</h2>`;
  if (lines.length === 0) {
    return `${heading}\n<p>none</p>`;
  }
  const shown = lines.slice(0, LIST_TRUNCATE).map(
    (line) => `<p>${escapeHtml(line)}</p>`,
  );
  const remaining = lines.length - LIST_TRUNCATE;
  if (remaining > 0) {
    shown.push(`<p>+${remaining} more</p>`);
  }
  return `${heading}\n${shown.join("\n")}`;
}

export function renderOperatorDigestHtml(digest: OperatorDigest): string {
  const { header, lists } = digest;
  const quietLines = lists.quietSubscribers.map(
    (row) =>
      `${row.name} · ${row.plan_tier} · last ${row.last_submitted} · ${row.eval_count} evals`,
  );
  const neverLines = lists.neverActivated.map(
    (row) => `${row.name} · signed up ${row.signup_date} · ${row.confirmed}`,
  );
  const creditLines = lists.creditsAtRisk.map(
    (row) =>
      `${row.name} · ${row.quantity_remaining} remaining · expires ${row.expires_at}`,
  );
  const renewalLines = lists.renewals.map(
    (row) =>
      `${row.name} · ${row.current_period_end} · ${row.interval_label}`,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(digestSubject(digest.attentionCount))}</title>
</head>
<body style="margin:0;padding:24px;background:#ffffff;color:#111111;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.5;">
<h1>Sermon Coach weekly</h1>
<p>Evaluations submitted, last 7 days: ${header.evaluationsLast7Days}</p>
<p>Evaluations submitted, the 7 days before that: ${header.evaluationsPrevious7Days}</p>
<p>New accounts, last 7 days: ${header.newAccountsLast7Days}</p>
<p>Accounts lifetime with 2 or more evaluations: ${header.accountsWithTwoOrMoreEvals}</p>
${renderListBlock("Quiet subscribers", quietLines)}
${renderListBlock("Never activated (confirmed accounts)", neverLines)}
${renderListBlock("Credits at risk", creditLines)}
${renderListBlock("Renewals, next 14 days", renewalLines)}
</body>
</html>`;
}
