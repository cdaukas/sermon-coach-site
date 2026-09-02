import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByEmail } from "@/lib/email/tuesday-nudge-opt-out";
import {
  planTuesdayNudgeRecipients,
  startOfUtcIsoWeek,
} from "@/lib/email/tuesday-nudge-recipients";
import { sendTuesdayNudgeEmail } from "@/lib/email/tuesday-nudge-send";
import {
  renderTuesdayNudgeHtml,
  renderTuesdayNudgeText,
  TUESDAY_NUDGE_SUBJECT,
} from "@/lib/email/tuesday-nudge-template";
import { buildTuesdayNudgeUnsubscribeUrl } from "@/lib/email/tuesday-nudge-unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function isDryRun(request: Request): boolean {
  const url = new URL(request.url);
  const flag = url.searchParams.get("dryRun") ?? url.searchParams.get("dryrun");
  return flag === "1" || flag === "true";
}

function parseTestTo(request: Request): string | null {
  const value = new URL(request.url).searchParams.get("testTo")?.trim() ?? "";
  return value.length > 0 ? value : null;
}

async function sendOneTuesdayNudge(params: {
  apiKey: string;
  email: string;
}) {
  const unsubscribeUrl = buildTuesdayNudgeUnsubscribeUrl(params.email);
  const html = renderTuesdayNudgeHtml({ unsubscribeUrl });
  const text = renderTuesdayNudgeText({ unsubscribeUrl });
  return sendTuesdayNudgeEmail({
    apiKey: params.apiKey,
    to: params.email,
    html,
    text,
    unsubscribeUrl,
  });
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return unauthorized();
  }

  const testTo = parseTestTo(request);
  const dryRun = isDryRun(request);
  const now = new Date();

  try {
    const supabase = createAdminClient();

    if (testTo) {
      if (!testTo.includes("@")) {
        return NextResponse.json(
          { error: "unknown_address" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      const userId = await findAuthUserIdByEmail(supabase, testTo);
      if (!userId) {
        return NextResponse.json(
          { error: "unknown_address" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      const { data: authUser, error: authUserError } =
        await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email?.trim().toLowerCase() ?? null;
      if (authUserError || !email) {
        return NextResponse.json(
          { error: "unknown_address" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "unknown_address" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (!apiKey) {
        console.error("[tuesday_nudge] RESEND_API_KEY missing or empty");
        return NextResponse.json(
          { error: "email_not_configured" },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        );
      }

      const sendResult = await sendOneTuesdayNudge({
        apiKey,
        email,
      });

      if (!sendResult.ok) {
        console.error("[tuesday_nudge] test send failed", {
          email: testTo,
          error: sendResult.error,
        });
        return NextResponse.json(
          { error: sendResult.error },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        );
      }

      const summary = {
        tag: "tuesday_nudge",
        test: true,
        to: email,
        resend_id: sendResult.id,
        stamped: false,
      };
      console.log(JSON.stringify(summary));
      return NextResponse.json(summary, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const plan = await planTuesdayNudgeRecipients(supabase, now);

    if (dryRun) {
      const summary = {
        tag: "tuesday_nudge",
        dry_run: true,
        subject: TUESDAY_NUDGE_SUBJECT,
        send: plan.send.map((row) => ({
          email: row.email,
          created_at: row.createdAt,
        })),
        skipped: plan.skipped.map((row) => ({
          email: row.email,
          reason: row.reason,
        })),
        empty_inactive_caught: plan.emptyInactiveCaught.map((row) => ({
          email: row.email,
          created_at: row.createdAt,
          last_sign_in_at: row.lastSignInAt,
          sermon_count: row.sermonCount,
          evaluation_count: row.evaluationCount,
        })),
      };
      console.log(JSON.stringify(summary));
      return NextResponse.json(summary, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error("[tuesday_nudge] RESEND_API_KEY missing or empty");
      return NextResponse.json(
        { error: "email_not_configured" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    const weekStartIso = startOfUtcIsoWeek(now).toISOString();
    const sentAt = now.toISOString();
    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const recipient of plan.send) {
      const sendResult = await sendOneTuesdayNudge({
        apiKey,
        email: recipient.email,
      });

      if (!sendResult.ok) {
        failed += 1;
        errors.push({ email: recipient.email, error: sendResult.error });
        console.error("[tuesday_nudge] send failed", {
          email: recipient.email,
          error: sendResult.error,
        });
        continue;
      }

      const { data: stamped, error: stampError } = await supabase
        .from("profiles")
        .update({ tuesday_nudge_last_sent_at: sentAt })
        .eq("id", recipient.id)
        .eq("tuesday_nudge_opted_in", true)
        .or(
          `tuesday_nudge_last_sent_at.is.null,tuesday_nudge_last_sent_at.lt."${weekStartIso}"`,
        )
        .select("id")
        .maybeSingle();

      if (stampError || !stamped) {
        failed += 1;
        errors.push({
          email: recipient.email,
          error: stampError?.message ?? "same-week stamp already set",
        });
        console.error("[tuesday_nudge] stamp failed after send", {
          email: recipient.email,
          resend_id: sendResult.id,
          error: stampError?.message ?? "same-week stamp already set",
        });
        continue;
      }

      sent += 1;
    }

    const summary = {
      tag: "tuesday_nudge",
      dry_run: false,
      subject: TUESDAY_NUDGE_SUBJECT,
      due: plan.send.length,
      sent,
      failed,
      skipped: plan.skipped.map((row) => ({
        email: row.email,
        reason: row.reason,
      })),
      empty_inactive_caught: plan.emptyInactiveCaught.map((row) => ({
        email: row.email,
      })),
      errors,
    };

    console.log(JSON.stringify(summary));
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "tuesday nudge failed";
    console.error("[tuesday_nudge]", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
