import { getResendClient } from "./client";
import {
  getEmailFromAddress,
  getEmailReplyTo,
  isEmailConfigured,
} from "./config";

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendTransactionalEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY not set; skipping send");
    return { ok: false, error: "Email is not configured.", skipped: true };
  }

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to: input.to,
    replyTo: input.replyTo ?? getEmailReplyTo(),
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "Resend returned no message id." };
  }

  return { ok: true, id: data.id };
}
