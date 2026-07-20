/** Lifecycle welcome / first-eval / onboarding-nudge (Supabase functions mirror this locally). */
export const RESEND_FROM = "Chris Daukas <chris@sermoncoach.online>";

/** Weekly blog teaser sends via npm run blog:send. */
export const BLOG_EMAIL_FROM =
  "Chris Daukas · The Sermon Coach <chris@sermoncoach.com>";
export const RESEND_REPLY_TO = "chris@sermoncoach.online";
export const RESEND_API_URL = "https://api.resend.com/emails";

export const BLOG_EMAIL_CTA_URL = "https://www.sermoncoach.online/start";

export const BLOG_EMAIL_CTA_PARAGRAPH =
  "Run your next sermon through The Sermon Coach tool before Sunday. If you are new here, your first evaluation's free. No card, no commitment. Paste in a manuscript or transcript (YouTube link), get the full assessment back in a few minutes, and see if it's useful before you decide anything. If it's helpful, pass it along to your pastor friends who preach!";

export const BLOG_EMAIL_CTA_BUTTON_LABEL = "Run an evaluation";

export const BLOG_EMAIL_FOOTER_LINE_1 =
  "The Sermon Coach™ · Built by Dr. Christopher M. Daukas · Phoenix, Arizona";

export const BLOG_EMAIL_MAILING_ADDRESS =
  "Daukas Group, LLC · 9572 W Frank Ave, Peoria, AZ 85382";

/** @deprecated Use BLOG_EMAIL_FOOTER_LINE_1 — kept for any stale imports. */
export const BLOG_EMAIL_FOOTER = BLOG_EMAIL_FOOTER_LINE_1;

export const BLOG_EMAIL_UNSUBSCRIBE_BASE_URL =
  "https://www.sermoncoach.online/unsubscribe";
