import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

export const SEAT_END_KEEP_GOING_PATH = "/dashboard/buy";

export type RenderSeatEndEmailParams = {
  menteeGreeting: string;
  mentorName: string;
  includeCoachPitch: boolean;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function menteeGreetingFromDisplayName(
  displayName: string | null | undefined,
): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "Hi there";
}

export function mentorNameFromDisplayName(
  displayName: string | null | undefined,
): string {
  const trimmed = displayName?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "your mentor";
}

export function seatEndEmailSubject(mentorName: string): string {
  return `Your seat with ${mentorName} has ended`;
}

export function menteeIsActiveCoach(
  subscriptionStatus: string | null | undefined,
  planTier: string | null | undefined,
): boolean {
  return subscriptionStatus === "active" && planTier === "coach";
}

export function renderSeatEndEmailHtml(
  params: RenderSeatEndEmailParams,
): string {
  const greeting = escapeHtml(params.menteeGreeting);
  const mentorName = escapeHtml(params.mentorName);
  const keepGoingUrl = escapeHtml(
    `${CANONICAL_SITE_ORIGIN}${SEAT_END_KEEP_GOING_PATH}`,
  );
  const preheader = escapeHtml(
    `Your mentoring seat with ${params.mentorName} has ended.`,
  );

  const pitch = params.includeCoachPitch
    ? `<p style="margin:0 0 16px;">If you want to keep going, a Coach plan is $29 a month and gives you ten evaluations, your own growth reporting, and the Sketch before you write.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your seat with ${mentorName} has ended</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf8f3;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d4cfc1;">
          <tr>
            <td style="padding:32px 32px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#2a3447;">
              <p style="margin:0 0 16px;">${greeting},</p>
              <p style="margin:0 0 16px;">Your mentoring seat with ${mentorName} has ended. Everything they released to you is still in your library, and your account stays open.</p>
              ${pitch}
              <p style="margin:0 0 24px;"><a href="${keepGoingUrl}" style="color:#1a2332;font-weight:600;">Keep going</a></p>
              <p style="margin:0;">Christopher M. Daukas<br>The Sermon Coach</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
