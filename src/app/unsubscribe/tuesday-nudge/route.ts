import { createAdminClient } from "@/lib/supabase/admin";
import { optOutTuesdayNudgeByEmail } from "@/lib/email/tuesday-nudge-opt-out";
import { verifyTuesdayNudgeUnsubscribeToken } from "@/lib/email/tuesday-nudge-unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;">
  <div style="display:flex;min-height:100vh;flex-direction:column;padding:40px 24px;box-sizing:border-box;">
    <main style="margin:auto;width:100%;max-width:520px;">
      <div style="background:#ffffff;border:1px solid #d4cfc1;border-radius:4px;padding:36px 32px;text-align:center;">
        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#1a2332;">${title}</h1>
        <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:#4a5568;">${message}</p>
      </div>
    </main>
  </div>
</body>
</html>`;
}

function htmlResponse(title: string, message: string, status = 200): Response {
  return new Response(htmlPage(title, message), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function applyToken(token: string | null): Promise<Response> {
  if (!token) {
    return htmlResponse(
      "Invalid unsubscribe link",
      "This link is missing a token. Use the unsubscribe link from a Tuesday reminder email.",
      400,
    );
  }

  const email = verifyTuesdayNudgeUnsubscribeToken(token);
  if (!email) {
    return htmlResponse(
      "Invalid unsubscribe link",
      "This link is invalid. Use the unsubscribe link from a Tuesday reminder email.",
      400,
    );
  }

  const supabase = createAdminClient();
  const result = await optOutTuesdayNudgeByEmail(supabase, email);

  if (!result.ok) {
    if (result.error === "not_found") {
      return htmlResponse(
        "Invalid unsubscribe link",
        "We could not find an account for this link.",
        404,
      );
    }
    return htmlResponse(
      "Something went wrong",
      "We could not save your unsubscribe request. Email Chris at chris@sermoncoach.com and he will remove you manually.",
      500,
    );
  }

  return htmlResponse(
    "You are unsubscribed",
    "You will no longer receive the Tuesday reminder. This does not change any other email from The Sermon Coach.",
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return applyToken(token);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return applyToken(token);
}
