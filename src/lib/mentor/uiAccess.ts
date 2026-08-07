function parseAllowlist(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * Mentoring rail and panel — seats, invites, mentee list.
 * Comma-separated profile ids in MENTORING_UI_ALLOWLIST.
 * Absent or empty → deny.
 * Independent of MENTORING_DEBRIEF_ALLOWLIST.
 */
export function isMentoringUiAllowed(userId: string): boolean {
  return parseAllowlist(process.env.MENTORING_UI_ALLOWLIST).includes(userId);
}

/**
 * Stopgap ordinary Mentoring Debrief on the owner's library (Coach credits).
 * Comma-separated profile ids in MENTORING_DEBRIEF_ALLOWLIST.
 * Absent or empty → deny.
 * Independent of MENTORING_UI_ALLOWLIST; checked only on sermon detail + requestEvaluation.
 */
export function isMentoringDebriefAllowed(userId: string): boolean {
  return parseAllowlist(process.env.MENTORING_DEBRIEF_ALLOWLIST).includes(
    userId,
  );
}
