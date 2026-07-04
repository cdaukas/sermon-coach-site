import { RESEND_API_URL, RESEND_FROM, RESEND_REPLY_TO } from "./constants";

export type SendResendEmailParams = {
  apiKey: string;
  to: string[];
  subject: string;
  html: string;
};

export type SendResendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<SendResendEmailResult> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: params.to,
      reply_to: RESEND_REPLY_TO,
      subject: params.subject,
      html: params.html,
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
