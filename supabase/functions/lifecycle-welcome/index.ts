import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_FROM = "Chris Daukas <chris@sermoncoach.online>";
const RESEND_REPLY_TO = "chris@sermoncoach.online";
const DEFAULT_SITE_URL = "https://sermoncoach.online";

type DbWebhookUpdatePayload = {
  type: "UPDATE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown>;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readConfirmedAt(record: Record<string, unknown> | null | undefined):
  | string
  | null {
  if (!record) {
    return null;
  }

  const emailConfirmed = record.email_confirmed_at;
  if (typeof emailConfirmed === "string" && emailConfirmed.length > 0) {
    return emailConfirmed;
  }

  const confirmed = record.confirmed_at;
  if (typeof confirmed === "string" && confirmed.length > 0) {
    return confirmed;
  }

  return null;
}

function isEmailConfirmationTransition(payload: DbWebhookUpdatePayload): boolean {
  if (payload.type !== "UPDATE") {
    return false;
  }
  if (payload.schema !== "auth" || payload.table !== "users") {
    return false;
  }

  const wasConfirmed = readConfirmedAt(payload.old_record);
  const isConfirmed = readConfirmedAt(payload.record);
  return wasConfirmed === null && isConfirmed !== null;
}

function buildWelcomeHtml(dashboardUrl: string): string {
  return [
    "<p>Hi,</p>",
    "<p>You're in. Here's your next step: paste your sermon manuscript (or a transcript, if it's a message you've already preached) into your dashboard and save.</p>",
    "<p>You can sharpen an upcoming message or test the rubric on an old one on purpose. Before you run the report, choose Personal for your own study, or Mentoring if you're walking alongside another preacher. Your evaluation comes back in a few minutes.</p>",
    `<p><a href="${dashboardUrl}">Submit your first sermon →</a></p>`,
    "<p>— Chris</p>",
  ].join("\n");
}

async function sendWelcomeEmail(params: {
  to: string;
  dashboardUrl: string;
  resendApiKey: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [params.to],
      reply_to: RESEND_REPLY_TO,
      subject: "You're in. Here's where to start.",
      html: buildWelcomeHtml(params.dashboardUrl),
    }),
  });

  const body = await response.json().catch(() => ({}));

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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[lifecycle-welcome] Missing Supabase env");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: DbWebhookUpdatePayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!isEmailConfirmationTransition(payload)) {
    return jsonResponse({ skipped: true, reason: "not_confirmation_transition" });
  }

  const userId = payload.record.id;
  if (typeof userId !== "string" || userId.length === 0) {
    return jsonResponse({ error: "Missing user id in webhook record" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const claimedAt = new Date().toISOString();
  const { data: claimedProfile, error: claimError } = await supabase
    .from("profiles")
    .update({ welcome_sent_at: claimedAt })
    .eq("id", userId)
    .is("welcome_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[lifecycle-welcome] welcome_sent_at claim failed", claimError);
    return jsonResponse({ error: claimError.message }, 500);
  }

  if (!claimedProfile) {
    return jsonResponse({ skipped: true, reason: "welcome_already_sent" });
  }

  if (!resendApiKey) {
    console.error("[lifecycle-welcome] RESEND_API_KEY not set");
    return jsonResponse({ error: "Email is not configured" }, 500);
  }

  const { data: userData, error: userError } = await supabase.auth.admin
    .getUserById(userId);

  if (userError || !userData.user?.email) {
    console.error("[lifecycle-welcome] Could not resolve user email", userError);
    return jsonResponse(
      { error: userError?.message ?? "User email not found" },
      500,
    );
  }

  const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(
    /\/$/,
    "",
  );
  const dashboardUrl = `${siteUrl}/dashboard`;

  const sendResult = await sendWelcomeEmail({
    to: userData.user.email,
    dashboardUrl,
    resendApiKey,
  });

  if (!sendResult.ok) {
    console.error("[lifecycle-welcome] Resend send failed", sendResult.error);
    return jsonResponse({ error: sendResult.error }, 500);
  }

  return jsonResponse({ sent: true, resend_id: sendResult.id });
});
