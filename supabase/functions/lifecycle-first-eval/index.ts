import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_FROM = "Chris Daukas <chris@sermoncoach.online>";
const RESEND_REPLY_TO = "chris@sermoncoach.online";
const FEEDBACK_DELAY_MS = 24 * 60 * 60 * 1000;

type DbWebhookPayload = {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readEvalStatus(record: Record<string, unknown> | null | undefined):
  | string
  | null {
  if (!record) {
    return null;
  }

  const status = record.status;
  return typeof status === "string" ? status : null;
}

function readCompletedAt(record: Record<string, unknown> | null | undefined):
  | string
  | null {
  if (!record) {
    return null;
  }

  const completedAt = record.completed_at;
  return typeof completedAt === "string" && completedAt.length > 0
    ? completedAt
    : null;
}

function isCompletedEvaluation(record: Record<string, unknown>): boolean {
  return readEvalStatus(record) === "complete" &&
    readCompletedAt(record) !== null;
}

function isEvaluationCompletionEvent(payload: DbWebhookPayload): boolean {
  if (payload.schema !== "public" || payload.table !== "sermon_evaluations") {
    return false;
  }

  if (!isCompletedEvaluation(payload.record)) {
    return false;
  }

  if (payload.type === "INSERT") {
    return true;
  }

  if (payload.type !== "UPDATE" || !payload.old_record) {
    return false;
  }

  return readEvalStatus(payload.old_record) !== "complete";
}

function buildFeedbackHtml(): string {
  return [
    "<p>Hi,</p>",
    "<p>You ran your first sermon through the rubric yesterday. I'm curious about one thing.</p>",
    "<p>Did anything in the evaluation surprise you? Something it caught that you hadn't noticed, or something you'd push back on?</p>",
    "<p>I read every reply myself. Just hit reply and tell me.</p>",
    "<p>— Chris</p>",
  ].join("\n");
}

async function sendFirstEvalFeedbackEmail(params: {
  to: string;
  resendApiKey: string;
  scheduledAt: string;
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
      subject: "Did anything surprise you?",
      html: buildFeedbackHtml(),
      scheduled_at: params.scheduledAt,
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

async function resolveUserIdForEvaluation(
  supabase: ReturnType<typeof createClient>,
  sermonVersionId: string,
): Promise<string | null> {
  const { data: version, error: versionError } = await supabase
    .from("sermon_versions")
    .select("sermon_id")
    .eq("id", sermonVersionId)
    .maybeSingle();

  if (versionError || !version?.sermon_id) {
    console.error(
      "[lifecycle-first-eval] sermon_versions lookup failed",
      versionError,
    );
    return null;
  }

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .select("user_id")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError || !sermon?.user_id) {
    console.error("[lifecycle-first-eval] sermons lookup failed", sermonError);
    return null;
  }

  return sermon.user_id;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[lifecycle-first-eval] Missing Supabase env");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: DbWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  console.log(
    "[first-eval] payload",
    JSON.stringify({
      type: payload.type,
      record_status: payload.record?.status,
      record_completed_at: payload.record?.completed_at,
      old_status: payload.old_record?.status,
      old_record_present: payload.old_record !== null,
    }),
  );

  const isCompletionEvent = isEvaluationCompletionEvent(payload);
  console.log("[first-eval] isEvaluationCompletionEvent", isCompletionEvent);

  if (!isCompletionEvent) {
    return jsonResponse({ skipped: true, reason: "not_completion_event" });
  }

  const sermonVersionId = payload.record.sermon_version_id;
  if (typeof sermonVersionId !== "string" || sermonVersionId.length === 0) {
    return jsonResponse({ error: "Missing sermon_version_id in record" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await resolveUserIdForEvaluation(supabase, sermonVersionId);
  if (!userId) {
    return jsonResponse({ error: "Could not resolve evaluation owner" }, 500);
  }

  const claimedAt = new Date().toISOString();
  const { data: claimedProfile, error: claimError } = await supabase
    .from("profiles")
    .update({ first_evaluation_at: claimedAt })
    .eq("id", userId)
    .is("first_evaluation_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error(
      "[lifecycle-first-eval] first_evaluation_at claim failed",
      claimError,
    );
    return jsonResponse({ error: claimError.message }, 500);
  }

  if (!claimedProfile) {
    return jsonResponse({ skipped: true, reason: "not_first_evaluation" });
  }

  if (!resendApiKey) {
    console.error("[lifecycle-first-eval] RESEND_API_KEY not set");
    return jsonResponse({ error: "Email is not configured" }, 500);
  }

  const { data: userData, error: userError } = await supabase.auth.admin
    .getUserById(userId);

  if (userError || !userData.user?.email) {
    console.error(
      "[lifecycle-first-eval] Could not resolve user email",
      userError,
    );
    return jsonResponse(
      { error: userError?.message ?? "User email not found" },
      500,
    );
  }

  const scheduledAt = new Date(Date.now() + FEEDBACK_DELAY_MS).toISOString();
  const sendResult = await sendFirstEvalFeedbackEmail({
    to: userData.user.email,
    resendApiKey,
    scheduledAt,
  });

  if (!sendResult.ok) {
    console.error("[lifecycle-first-eval] Resend send failed", sendResult.error);
    return jsonResponse({ error: sendResult.error }, 500);
  }

  return jsonResponse({
    scheduled: true,
    resend_id: sendResult.id,
    scheduled_at: scheduledAt,
  });
});
