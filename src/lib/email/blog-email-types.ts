export type BlogEmailWeekContent = {
  /** Absent means "teaser". */
  kind?: "teaser";
  week: number;
  subject: string;
  headline: string;
  /** HTML paragraphs for the teaser body (locked template wraps this). */
  teaserHtml: string;
  /** Full blog post URL for the "Read the post →" link. */
  blogUrl: string;
};

export type UpdateEmailContent = {
  kind: "update";
  subject: string;
  headline: string;
  bodyHtml: string;
};

export type EmailContent = BlogEmailWeekContent | UpdateEmailContent;
