export type BlogEmailWeekContent = {
  week: number;
  subject: string;
  headline: string;
  /** HTML paragraphs for the teaser body (locked template wraps this). */
  teaserHtml: string;
  /** Full blog post URL for the "Read the post →" link. */
  blogUrl: string;
};
