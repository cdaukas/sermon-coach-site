import { NextResponse } from "next/server";
import {
  isHeavyDottedGmail,
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  parseNewsletterSource,
} from "@/lib/email/newsletter";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SubscribeBody = {
  email?: unknown;
  source?: unknown;
};

const INVALID_EMAIL_BODY = {
  ok: false as const,
  error: "invalid_email" as const,
  message: "Please enter a valid email address",
};

export async function POST(request: Request) {
  let body: SubscribeBody;

  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  if (!isValidNewsletterEmail(rawEmail)) {
    return NextResponse.json(INVALID_EMAIL_BODY, { status: 400 });
  }

  // Bot guard: 4+ dots in Gmail local part (pre-normalization). Same generic
  // response as invalid email — do not reveal the rule.
  if (isHeavyDottedGmail(rawEmail)) {
    return NextResponse.json(INVALID_EMAIL_BODY, { status: 400 });
  }

  const email = normalizeNewsletterEmail(rawEmail);
  const source = parseNewsletterSource(body.source);
  const supabase = createAdminClient();

  const { error } = await supabase.from("newsletter_subscribers").upsert(
    {
      email,
      source,
      subscribed_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.code === "PGRST205"
    ) {
      console.error(
        "newsletter_subscribers table missing — apply migration 20260706120000_newsletter_subscribers.sql",
      );
      return NextResponse.json(
        { ok: false, error: "not_configured" },
        { status: 503 },
      );
    }

    console.error("newsletter_subscribers upsert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
