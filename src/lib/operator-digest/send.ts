import {
  RESEND_API_URL,
  RESEND_FROM,
  RESEND_REPLY_TO,
} from "@/lib/email/constants";
import { OPERATOR_DIGEST_TO } from "./digest";

export type SendOperatorDigestParams = {
  apiKey: string;
  subject: string;
  html: string;
};

export type SendOperatorDigestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendOperatorDigestEmail(
  params: SendOperatorDigestParams,
): Promise<SendOperatorDigestResult> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [OPERATOR_DIGEST_TO],
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
