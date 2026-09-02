import { RESEND_API_URL } from "@/lib/email/constants";
import {
  TUESDAY_NUDGE_FROM,
  TUESDAY_NUDGE_REPLY_TO,
  TUESDAY_NUDGE_SUBJECT,
} from "@/lib/email/tuesday-nudge-template";

export type SendTuesdayNudgeEmailParams = {
  apiKey: string;
  to: string;
  html: string;
  unsubscribeUrl: string;
};

export type SendTuesdayNudgeEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendTuesdayNudgeEmail(
  params: SendTuesdayNudgeEmailParams,
): Promise<SendTuesdayNudgeEmailResult> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: TUESDAY_NUDGE_FROM,
      to: [params.to],
      reply_to: TUESDAY_NUDGE_REPLY_TO,
      subject: TUESDAY_NUDGE_SUBJECT,
      html: params.html,
      headers: {
        "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Resend request failed (${response.status})`;
    return { ok: false, error: message };
  }

  const id =
    typeof body === "object" &&
    body !== null &&
    "id" in body &&
    typeof (body as { id: unknown }).id === "string"
      ? (body as { id: string }).id
      : null;

  if (!id) {
    return { ok: false, error: "Resend returned no message id." };
  }

  return { ok: true, id };
}
