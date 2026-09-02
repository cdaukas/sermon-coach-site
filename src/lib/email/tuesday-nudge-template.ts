import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

export const TUESDAY_NUDGE_SUBJECT = "Your Tuesday reminder";

export const TUESDAY_NUDGE_DASHBOARD_URL = `${CANONICAL_SITE_ORIGIN}/dashboard`;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function tuesdayNudgeFirstName(
  displayName: string | null | undefined,
): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

export function renderTuesdayNudgeHtml(params: {
  firstName: string | null;
  dashboardUrl: string;
  unsubscribeUrl: string;
}): string {
  const dashboardUrl = escapeHtml(params.dashboardUrl);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);
  const greeting = params.firstName
    ? `<p>Hi ${escapeHtml(params.firstName)},</p>\n`
    : "";

  return [
    `${greeting}<p>You asked for a nudge on Tuesdays, so here it is. If you are preaching Sunday, this is the day the manuscript is far enough along to be worth a read.</p>`,
    `<p><a href="${dashboardUrl}">Open your dashboard</a></p>`,
    `<p>If Tuesday is the wrong day, or you would rather not get these, unsubscribe here: <a href="${unsubscribeUrl}">unsubscribe</a></p>`,
    "<p>Chris</p>",
  ].join("\n");
}
