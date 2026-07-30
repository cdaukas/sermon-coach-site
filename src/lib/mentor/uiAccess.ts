/**
 * Mentoring UI is gated until canon Open blockers clear.
 * Comma-separated profile ids in MENTORING_UI_ALLOWLIST.
 * Absent or empty → deny.
 */
export function isMentoringUiAllowed(userId: string): boolean {
  const raw = process.env.MENTORING_UI_ALLOWLIST?.trim();
  if (!raw) {
    return false;
  }

  const allowlist = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return allowlist.includes(userId);
}
