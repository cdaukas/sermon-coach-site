import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assembleOperatorDigest,
  digestSubject,
  renderOperatorDigestHtml,
} from "@/lib/operator-digest/digest";
import {
  loadDigestAuthUsers,
  loadDigestEvals,
  loadDigestGrants,
  loadDigestProfiles,
} from "@/lib/operator-digest/load";
import { sendOperatorDigestEmail } from "@/lib/operator-digest/send";

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

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return unauthorized();
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[operator_digest] RESEND_API_KEY missing or empty");
    return NextResponse.json(
      { error: "email_not_configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const [profiles, evals, grants, authUsers] = await Promise.all([
      loadDigestProfiles(supabase),
      loadDigestEvals(supabase),
      loadDigestGrants(supabase),
      loadDigestAuthUsers(supabase),
    ]);

    const digest = assembleOperatorDigest({
      now,
      profiles,
      evals,
      grants,
      authUsers,
    });
    const subject = digestSubject(digest.attentionCount);
    const html = renderOperatorDigestHtml(digest);
    const sent = await sendOperatorDigestEmail({ apiKey, subject, html });

    if (!sent.ok) {
      throw new Error(sent.error);
    }

    const summary = {
      tag: "operator_digest",
      subject,
      resend_id: sent.id,
      attention_count: digest.attentionCount,
      header: digest.header,
      list_counts: {
        quiet_subscribers: digest.lists.quietSubscribers.length,
        never_activated: digest.lists.neverActivated.length,
        credits_at_risk: digest.lists.creditsAtRisk.length,
        renewals: digest.lists.renewals.length,
      },
    };

    console.log(JSON.stringify(summary));
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "digest failed";
    console.error("[operator_digest]", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
