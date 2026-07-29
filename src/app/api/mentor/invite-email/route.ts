import { sendMentorInviteEmail } from "@/lib/email/send-mentor-invite-email";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT_MESSAGE =
  "You have sent several invitations today. Try again tomorrow, or copy the link and send it yourself.";

type InviteEmailBody = {
  token?: unknown;
  to?: unknown;
};

type StampMentorInviteEmailResult = {
  ok?: boolean;
  error_code?: string;
  sent_to?: string | null;
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

function parseStampResult(data: unknown): StampMentorInviteEmailResult {
  if (!data || typeof data !== "object") {
    return {};
  }
  return data as StampMentorInviteEmailResult;
}

function jsonForStampError(
  result: StampMentorInviteEmailResult,
): NextResponse | null {
  const code = result.error_code;
  if (!code) return null;

  switch (code) {
    case "not_authenticated":
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    case "missing_email":
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 },
      );
    case "invalid_token":
    case "not_your_invite":
      return NextResponse.json(
        { ok: false, error: "invite_not_found" },
        { status: 404 },
      );
    case "not_pending":
      return NextResponse.json(
        { ok: false, error: "invite_not_pending" },
        { status: 409 },
      );
    case "already_sent":
      return NextResponse.json(
        {
          ok: false,
          error: "already_sent",
          sent_to: result.sent_to ?? null,
        },
        { status: 409 },
      );
    case "rate_limited":
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: RATE_LIMIT_MESSAGE,
        },
        { status: 429 },
      );
    default:
      return null;
  }
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
      { status: 409 },
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

  const { data: stampData, error: stampRpcError } = await supabase.rpc(
    "stamp_mentor_invite_email",
    {
      p_token: token,
      p_email: to,
    },
  );

  if (stampRpcError) {
    console.error(
      "[mentor/invite-email] stamp RPC failed after successful Resend send",
      {
        resend_id: sendResult.id,
        error: stampRpcError.message,
      },
    );
    return NextResponse.json(
      {
        ok: false,
        error: "stamp_failed_after_send",
        resend_id: sendResult.id,
      },
      { status: 500 },
    );
  }

  const stampResult = parseStampResult(stampData);

  if (stampResult.ok !== true) {
    const mapped = jsonForStampError(stampResult);
    if (mapped) {
      console.error(
        "[mentor/invite-email] stamp RPC rejected after successful Resend send",
        {
          resend_id: sendResult.id,
          error_code: stampResult.error_code,
          sent_to: stampResult.sent_to,
        },
      );
      return NextResponse.json(
        {
          ok: false,
          error: "stamp_failed_after_send",
          resend_id: sendResult.id,
          detail: stampResult.error_code,
        },
        { status: 500 },
      );
    }

    console.error(
      "[mentor/invite-email] stamp RPC returned unexpected payload after send",
      { resend_id: sendResult.id, stampData },
    );
    return NextResponse.json(
      {
        ok: false,
        error: "stamp_failed_after_send",
        resend_id: sendResult.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sent_to: to, resend_id: sendResult.id });
}
