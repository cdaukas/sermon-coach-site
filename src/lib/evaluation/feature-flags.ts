/** Demo-only feature flags — evaluated per account (user id). */

export function isHowItPreachesEnabled(userId: string): boolean {
  const demoAccountUserId = process.env.DEMO_ACCOUNT_USER_ID?.trim();
  if (!demoAccountUserId) {
    return false;
  }
  return userId === demoAccountUserId;
}
