import {
  BLOG_EMAIL_CTA_BUTTON_LABEL,
  BLOG_EMAIL_CTA_PARAGRAPH,
  BLOG_EMAIL_CTA_URL,
  BLOG_EMAIL_FOOTER,
} from "./constants";
import type { BlogEmailWeekContent } from "./blog-email-types";

export type RenderBlogEmailParams = {
  content: BlogEmailWeekContent;
  unsubscribeUrl: string;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderBlogEmailHtml(params: RenderBlogEmailParams): string {
  const { content, unsubscribeUrl } = params;
  const headline = escapeHtml(content.headline);
  const blogUrl = escapeHtml(content.blogUrl);
  const ctaUrl = escapeHtml(BLOG_EMAIL_CTA_URL);
  const ctaParagraph = escapeHtml(BLOG_EMAIL_CTA_PARAGRAPH);
  const ctaButtonLabel = escapeHtml(BLOG_EMAIL_CTA_BUTTON_LABEL);
  const footer = escapeHtml(BLOG_EMAIL_FOOTER);
  const unsubscribe = escapeHtml(unsubscribeUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf8f3;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d4cfc1;">
          <tr>
            <td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;">
              <p style="margin:0 0 24px;font-size:20px;font-weight:600;color:#1a2332;letter-spacing:-0.01em;">
                The Sermon <span style="color:#a67c2e;">Coach</span>™
              </p>
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#a67c2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                This week on the blog
              </p>
              <h1 style="margin:0 0 20px;font-size:28px;line-height:1.25;font-weight:600;color:#1a2332;">
                ${headline}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#2a3447;">
              ${content.teaserHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;">
              <a href="${blogUrl}" style="color:#a67c2e;font-weight:600;text-decoration:underline;">Read the full post →</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:4px;background:#1a2332;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#faf8f3;text-decoration:none;letter-spacing:0.02em;">
                      ${ctaButtonLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5;color:#4a5568;">
                ${ctaParagraph}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #d4cfc1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.6;color:#4a5568;">
              <p style="margin:0 0 8px;">${footer}</p>
              <p style="margin:0;">
                <a href="${unsubscribe}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a>
                from weekly blog emails.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
