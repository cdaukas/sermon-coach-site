import {
  RESEND_API_URL,
  RESEND_REPLY_TO,
  SEAT_END_EMAIL_FROM,
} from "./constants";
import {
  renderSeatEndEmailHtml,
  seatEndEmailSubject,
  type RenderSeatEndEmailParams,
} from "./seat-end-email-template";

export type SendSeatEndEmailParams = RenderSeatEndEmailParams & {
  apiKey: string;
  to: string;
};

export type SendSeatEndEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendSeatEndEmail(
  params: SendSeatEndEmailParams,
): Promise<SendSeatEndEmailResult> {
  const subject = seatEndEmailSubject(params.mentorName);
  const html = renderSeatEndEmailHtml({
    menteeGreeting: params.menteeGreeting,
    mentorName: params.mentorName,
    includeCoachPitch: params.includeCoachPitch,
  });

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SEAT_END_EMAIL_FROM,
      to: [params.to],
      reply_to: RESEND_REPLY_TO,
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
