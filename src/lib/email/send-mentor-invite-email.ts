import { renderInviteEmailHtml } from "@/lib/email/invite-email-template";

const INVITE_EMAIL_FROM_ADDRESS = "chris@sermoncoach.online";
const RESEND_API_URL = "https://api.resend.com/emails";

export type SendMentorInviteEmailParams = {
  apiKey: string;
  to: string;
  displayName: string;
  mentorReplyTo: string;
  token: string;
};

export type SendMentorInviteEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Escape display name for use inside a quoted RFC 5322 display-name. */
function quoteDisplayNameForFrom(name: string): string {
  const trimmed = name.trim();
  const escaped = trimmed.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `"${escaped} via The Sermon Coach"`;
}

export function mentorInviteEmailFromHeader(displayName: string): string {
  return `${quoteDisplayNameForFrom(displayName)} <${INVITE_EMAIL_FROM_ADDRESS}>`;
}

export async function sendMentorInviteEmail(
  params: SendMentorInviteEmailParams,
): Promise<SendMentorInviteEmailResult> {
  const subject = `${params.displayName.trim()} wants to read your preaching`;
  const html = renderInviteEmailHtml({
    displayName: params.displayName,
    token: params.token,
  });

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mentorInviteEmailFromHeader(params.displayName),
      to: [params.to],
      reply_to: params.mentorReplyTo.trim(),
      subject,
      html,
    }),
  });

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Resend request failed (${response.status})`;
    return { ok: false, error: message };
  }

  const id =
    typeof body === "object" &&
    body !== null &&
    "id" in body &&
    typeof body.id === "string"
      ? body.id
      : null;

  if (!id) {
    return { ok: false, error: "Resend returned no message id." };
  }

  return { ok: true, id };
}
