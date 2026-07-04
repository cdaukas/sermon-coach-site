import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderBlogEmailHtml } from "./blog-email-template";
import { BLOG_EMAIL_CTA_URL } from "./constants";

describe("blog email template", () => {
  it("renders week content into the locked template", () => {
    const html = renderBlogEmailHtml({
      content: {
        week: 1,
        subject: "Test subject",
        headline: "Test Headline",
        teaserHtml: "<p>First paragraph.</p><p>Second paragraph.</p>",
        blogUrl: "https://www.sermoncoach.online/blog/test",
      },
      unsubscribeUrl: "https://www.sermoncoach.online/unsubscribe?pending=1",
    });

    assert.match(html, /Test Headline/);
    assert.match(html, /First paragraph/);
    assert.match(html, /Run an evaluation/);
    assert.match(html, /Run your next sermon through The Sermon Coach tool/);
    assert.match(html, new RegExp(BLOG_EMAIL_CTA_URL.replaceAll("/", "\\/")));
    assert.match(html, /Built by Dr\. Christopher Daukas · Phoenix, Arizona/);
    assert.match(html, /Read the full post/);
    assert.match(html, /Unsubscribe/);
    assert.match(html, /unsubscribe\?pending=1/);
  });
});
