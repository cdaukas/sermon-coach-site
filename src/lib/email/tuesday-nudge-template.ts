import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";
import { RESEND_FROM } from "@/lib/email/constants";

export const TUESDAY_NUDGE_SUBJECT = "The Tuesday Nudge";

export const TUESDAY_NUDGE_DASHBOARD_URL = `${CANONICAL_SITE_ORIGIN}/dashboard`;

export const TUESDAY_NUDGE_SKETCH_URL = `${CANONICAL_SITE_ORIGIN}/dashboard/sketch`;

export const TUESDAY_NUDGE_REPLY_TO = "chris@sermoncoach.com";

function mailboxFromFromHeader(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
}

/** Display name is independent of the mailbox; the address stays RESEND_FROM. */
export const TUESDAY_NUDGE_FROM = `The Sermon Coach <${mailboxFromFromHeader(RESEND_FROM)}>`;

const SERIF_STACK = "Georgia,'Times New Roman',serif";
const LINK_STYLE = "color:#a67c2e;text-decoration:underline;";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hairlineRule(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:20px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="border-top:1px solid #d4cfc1;font-size:0;line-height:0;height:1px;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
}

export function renderTuesdayNudgeText(params: {
  unsubscribeUrl: string;
}): string {
  return [
    "Here is your Tuesday nudge. Review your sermon from Sunday to celebrate the wins and lock in the areas for growth. If you are preaching this Sunday, use The Sketch to test your outline for alignment before you write the manuscript.",
    "",
    TUESDAY_NUDGE_DASHBOARD_URL,
    TUESDAY_NUDGE_SKETCH_URL,
    "",
    "Chris",
    "The Sermon Coach",
    "",
    "P.S. If this isn't helpful, click here to unsubscribe.",
    params.unsubscribeUrl,
  ].join("\n");
}

export function renderTuesdayNudgeHtml(params: {
  unsubscribeUrl: string;
}): string {
  const dashboardUrl = escapeHtml(TUESDAY_NUDGE_DASHBOARD_URL);
  const sketchUrl = escapeHtml(TUESDAY_NUDGE_SKETCH_URL);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);
  const rule = hairlineRule();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(TUESDAY_NUDGE_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf8f3;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d4cfc1;">
          <tr>
            <td style="padding:32px;font-family:${SERIF_STACK};">
              <p style="margin:0;font-family:${SERIF_STACK};font-size:18px;line-height:1.4;color:#1a2332;">The Sermon <span style="color:#a67c2e;">Coach</span></p>
              ${rule}
              <p style="margin:0 0 16px;font-family:${SERIF_STACK};font-size:16px;line-height:1.6;color:#2a3447;">Here is your Tuesday nudge. <a href="${dashboardUrl}" style="${LINK_STYLE}">Review your sermon from Sunday</a> to celebrate the wins and lock in the areas for growth. If you are preaching this Sunday, use <a href="${sketchUrl}" style="${LINK_STYLE}">The Sketch</a> to test your outline for alignment before you write the manuscript.</p>
              <p style="margin:0 0 16px;font-family:${SERIF_STACK};font-size:15px;line-height:1.6;color:#4a5568;">Chris<br>The Sermon Coach</p>
              <p style="margin:0;font-family:${SERIF_STACK};font-size:14px;line-height:1.6;color:#4a5568;">P.S. If this isn't helpful, <a href="${unsubscribeUrl}" style="${LINK_STYLE}">click here</a> to unsubscribe.</p>
              ${rule}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
