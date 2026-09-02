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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderTuesdayNudgeHtml(params: {
  unsubscribeUrl: string;
}): string {
  const dashboardUrl = escapeHtml(TUESDAY_NUDGE_DASHBOARD_URL);
  const sketchUrl = escapeHtml(TUESDAY_NUDGE_SKETCH_URL);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);

  return [
    `<p>Here is your Tuesday nudge. <a href="${dashboardUrl}">Review your sermon from Sunday</a> to celebrate the wins and lock in the areas for growth. If you are preaching this Sunday, use <a href="${sketchUrl}">The Sketch</a> to test your outline for alignment before you write the manuscript.</p>`,
    "<p>Chris</p>",
    `<p>P.S. If this isn't helpful, <a href="${unsubscribeUrl}">click here</a> to unsubscribe.</p>`,
  ].join("\n");
}
