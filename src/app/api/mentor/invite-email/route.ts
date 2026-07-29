import { sendMentorInviteEmail } from "@/lib/email/send-mentor-invite-email";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INVITE_EMAIL_DAILY_CAP = 10;
const INVITE_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

type InviteEmailBody = {
  token?: unknown;
  to?: unknown;
};

function isValidRecipientEmail(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function readResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export async function POST(request: Request) {
  const resendApiKey = readResendApiKey();
  if (!resendApiKey) {
    console.error("[mentor/invite-email] RESEND_API_KEY missing or empty");
    return NextResponse.json(
      { ok: false, error: "email_not_configured" },
      { status: 503 },
    );
  }

  let body: InviteEmailBody;
  try {
    body = (await request.json()) as InviteEmailBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const toRaw = typeof body.to === "string" ? body.to : "";

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "missing_token" },
      { status: 400 },
    );
  }

  if (!isValidRecipientEmail(toRaw)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const to = toRaw.trim().toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const mentorEmail = user.email?.trim();
  if (!mentorEmail) {
    return NextResponse.json(
      { ok: false, error: "mentor_email_missing" },
      { status: 400 },
    );
  }

  const { data: relationship, error: relError } = await supabase
    .from("mentor_relationships")
    .select("id, status, invite_email_to, invite_email_sent_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (relError) {
    console.error("[mentor/invite-email] relationship lookup failed", relError);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  if (!relationship) {
    return NextResponse.json(
      { ok: false, error: "invite_not_found" },
      { status: 404 },
    );
  }

  if (relationship.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: "invite_not_pending" },
      { status: 400 },
    );
  }

  if (relationship.invite_email_sent_at) {
    return NextResponse.json(
      {
        ok: false,
        error: "already_sent",
        sent_to: relationship.invite_email_to ?? null,
      },
      { status: 409 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[mentor/invite-email] profile lookup failed", profileError);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  const displayName =
    typeof profile?.display_name === "string"
      ? profile.display_name.trim()
      : "";

  if (!displayName) {
    return NextResponse.json(
      { ok: false, error: "display_name_required" },
      { status: 400 },
    );
  }

  const windowStart = new Date(Date.now() - INVITE_EMAIL_WINDOW_MS).toISOString();
  const { count: recentSendCount, error: countError } = await supabase
    .from("mentor_relationships")
    .select("id", { count: "exact", head: true })
    .gte("invite_email_sent_at", windowStart)
    .not("invite_email_sent_at", "is", null);

  if (countError) {
    console.error("[mentor/invite-email] rate limit count failed", countError);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  if ((recentSendCount ?? 0) >= INVITE_EMAIL_DAILY_CAP) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        message:
          "You have sent several invitations today. Try again tomorrow, or copy the link and send it yourself.",
      },
      { status: 429 },
    );
  }

  const sendResult = await sendMentorInviteEmail({
    apiKey: resendApiKey,
    to,
    displayName,
    mentorReplyTo: mentorEmail,
    token,
  });

  if (!sendResult.ok) {
    console.error("[mentor/invite-email] Resend send failed", sendResult.error);
    return NextResponse.json(
      { ok: false, error: "send_failed", message: sendResult.error },
      { status: 502 },
    );
  }

  const sentAt = new Date().toISOString();
  const { data: stamped, error: stampError } = await supabase
    .from("mentor_relationships")
    .update({
      invite_email_to: to,
      invite_email_sent_at: sentAt,
    })
    .eq("id", relationship.id)
    .is("invite_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (stampError) {
    console.error("[mentor/invite-email] stamp failed after send", stampError);
    return NextResponse.json(
      { ok: false, error: "stamp_failed", resend_id: sendResult.id },
      { status: 500 },
    );
  }

  if (!stamped) {
    return NextResponse.json(
      {
        ok: false,
        error: "already_sent",
        sent_to: relationship.invite_email_to ?? to,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, sent_to: to, resend_id: sendResult.id });
}
