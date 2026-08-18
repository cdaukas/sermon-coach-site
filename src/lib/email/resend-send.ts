import { BLOG_EMAIL_FROM, RESEND_API_URL, RESEND_REPLY_TO } from "./constants";

const DEFAULT_LIST_UNSUBSCRIBE_MAILTO =
  "mailto:chris@sermoncoach.online?subject=unsubscribe";

export type SendResendEmailParams = {
  apiKey: string;
  to: string[];
  subject: string;
  html: string;
  /** When set, RFC 8058 one-click List-Unsubscribe headers are included. */
  unsubscribePostUrl?: string;
  /** Overrides the mailto: value inside List-Unsubscribe (blog default used if omitted). */
  unsubscribeMailto?: string;
};

export type SendResendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<SendResendEmailResult> {
  const payload: Record<string, unknown> = {
    from: BLOG_EMAIL_FROM,
    to: params.to,
    reply_to: RESEND_REPLY_TO,
    subject: params.subject,
    html: params.html,
  };

  if (params.unsubscribePostUrl) {
    const mailto = params.unsubscribeMailto ?? DEFAULT_LIST_UNSUBSCRIBE_MAILTO;
    payload.headers = {
      "List-Unsubscribe": `<${params.unsubscribePostUrl}>, <${mailto}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
