import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

export type RenderInviteEmailParams = {
  displayName: string;
  token: string;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderInviteEmailHtml(params: RenderInviteEmailParams): string {
  const displayName = escapeHtml(params.displayName.trim());
  const inviteUrl = escapeHtml(
    `${CANONICAL_SITE_ORIGIN}/invite/${encodeURIComponent(params.token.trim())}`,
  );
  const preheader = escapeHtml("A seat on The Sermon Coach, on him.");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${displayName} wants to read your preaching</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf8f3;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d4cfc1;">
          <tr>
            <td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;">
              <p style="margin:0 0 24px;font-size:20px;font-weight:600;color:#1a2332;letter-spacing:-0.01em;">
                The Sermon <span style="color:#a67c2e;">Coach</span>™
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#2a3447;">
              <p style="margin:0 0 16px;">${displayName} has invited you to be mentored through The Sermon Coach.</p>
              <p style="margin:0 0 16px;">You submit sermons the way you already do. He reads what comes back. The seat is his, so there is nothing for you to pay.</p>
              <p style="margin:0 0 24px;">The invitation itself explains exactly what he sees and what you see. Worth reading before you decide.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:4px;background:#1a2332;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#faf8f3;text-decoration:none;letter-spacing:0.02em;">
                      See the invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#2a3447;">
              <p style="margin:0;">If you do not know ${displayName}, no need to reply. Nothing happens unless you accept.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
