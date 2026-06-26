import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}

/** Test-only: reset cached client between cases. */
export function resetResendClientForTests(): void {
  client = null;
}
