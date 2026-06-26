export const DEFAULT_EMAIL_FROM =
  "Chris Daukas <chris@sermoncoach.online>";

export const DEFAULT_REPLY_TO = "chris@sermoncoach.online";

export function getEmailFromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export function getEmailReplyTo(): string {
  return process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
