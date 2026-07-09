import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_FROM = "Chris Daukas <chris@sermoncoach.online>";
const RESEND_REPLY_TO = "chris@sermoncoach.online";
const BATCH_CAP = 100;
const CONFIRMED_AGE_MS = 3 * 24 * 60 * 60 * 1000;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildOnboardingNudgeHtml(): string {
  return [
    "<p>Hey there, it's me again.</p>",
    "<p>You created your account a few days ago, but I don't see a sermon from you yet. No pressure, I know the week gets away from all of us.</p>",
    "<p>Whenever you're ready, it's one step: paste a manuscript or transcript into your dashboard and save. Could be this Sunday's message, or one you preached years ago and always wondered about. The evaluation comes back in a few minutes.</p>",
    "<p>If something got in the way, a question, a file that wouldn't paste, anything, just hit reply and tell me. I read every one.</p>",
    "<p><a href=\"https://www.sermoncoach.online/dashboard\">Submit your first sermon →</a></p>",
    "<p>— Chris</p>",
  ].join("\n");
}

async function sendOnboardingNudgeEmail(params: {
  to: string;
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
      subject: "Checking in on you",
      html: buildOnboardingNudgeHtml(),
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

function isEmailConfirmedAtLeastThreeDaysAgo(
  emailConfirmedAt: string | null | undefined,
  nowMs: number,
): boolean {
  if (!emailConfirmedAt) {
    return false;
  }

  const confirmedMs = new Date(emailConfirmedAt).getTime();
  if (Number.isNaN(confirmedMs)) {
    return false;
  }

  return confirmedMs < nowMs - CONFIRMED_AGE_MS;
}

type DueUser = {
  id: string;
  email: string;
};

async function resolveDueUsers(
  supabase: ReturnType<typeof createClient>,
  nowMs: number,
): Promise<{ dueUsers: DueUser[]; skipped: number }> {
  const { data: candidates, error: candidatesError } = await supabase
    .from("profiles")
    .select("id")
    .not("welcome_sent_at", "is", null)
    .is("first_evaluation_at", null)
    .is("onboarding_nudge_sent_at", null);

  if (candidatesError) {
    console.error(
      "[onboarding-nudge] profiles candidate query failed",
      candidatesError,
    );
    throw new Error(candidatesError.message);
  }

  const dueUsers: DueUser[] = [];
  let skipped = 0;

  for (const candidate of candidates ?? []) {
    if (dueUsers.length >= BATCH_CAP) {
      break;
    }

    const userId = candidate.id;
    if (typeof userId !== "string" || userId.length === 0) {
      skipped += 1;
      console.log("[onboarding-nudge] skip invalid profile id", { userId });
      continue;
    }

    const { data: userData, error: userError } = await supabase.auth.admin
      .getUserById(userId);

    if (userError || !userData.user) {
      skipped += 1;
      console.log("[onboarding-nudge] skip auth lookup failed", {
        userId,
        error: userError?.message ?? "user not found",
      });
      continue;
    }

    const email = userData.user.email;
    if (!email) {
      skipped += 1;
      console.log("[onboarding-nudge] skip no email", { userId });
      continue;
    }

    if (
      !isEmailConfirmedAtLeastThreeDaysAgo(
        userData.user.email_confirmed_at,
        nowMs,
      )
    ) {
      skipped += 1;
      console.log("[onboarding-nudge] skip email not confirmed 3+ days ago", {
        userId,
        email_confirmed_at: userData.user.email_confirmed_at,
      });
      continue;
    }

    dueUsers.push({ id: userId, email });
  }

  return { dueUsers, skipped };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[onboarding-nudge] Missing Supabase env");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!resendApiKey) {
    console.error("[onboarding-nudge] RESEND_API_KEY not set");
    return jsonResponse({ error: "Email is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const nowMs = Date.now();
  let dueUsers: DueUser[];
  let authSkipped: number;

  try {
    const resolved = await resolveDueUsers(supabase, nowMs);
    dueUsers = resolved.dueUsers;
    authSkipped = resolved.skipped;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }

  console.log("[onboarding-nudge] due users", dueUsers.length);

  let sent = 0;
  let sendSkipped = 0;

  for (const user of dueUsers) {
    const sendResult = await sendOnboardingNudgeEmail({
      to: user.email,
      resendApiKey,
    });

    if (!sendResult.ok) {
      sendSkipped += 1;
      console.error("[onboarding-nudge] send failed", {
        userId: user.id,
        email: user.email,
        error: sendResult.error,
      });
      continue;
    }

    console.log("[onboarding-nudge] send ok", {
      userId: user.id,
      email: user.email,
      resend_id: sendResult.id,
    });

    // Stamp after successful send: a rare Resend failure leaves the pastor
    // eligible for the next daily run; we never double-email on retry.
    const stampedAt = new Date().toISOString();
    const { data: stampedProfile, error: stampError } = await supabase
      .from("profiles")
      .update({ onboarding_nudge_sent_at: stampedAt })
      .eq("id", user.id)
      .is("onboarding_nudge_sent_at", null)
      .select("id")
      .maybeSingle();

    if (stampError || !stampedProfile) {
      sendSkipped += 1;
      console.error("[onboarding-nudge] stamp failed after send", {
        userId: user.id,
        email: user.email,
        resend_id: sendResult.id,
        error: stampError?.message ?? "onboarding_nudge_sent_at already set",
      });
      continue;
    }

    sent += 1;
  }

  const due = dueUsers.length;
  const skipped = authSkipped + sendSkipped;

  console.log(
    `[onboarding-nudge] summary due=${due} sent=${sent} skipped=${skipped}`,
  );

  return jsonResponse({ due, sent, skipped });
});
