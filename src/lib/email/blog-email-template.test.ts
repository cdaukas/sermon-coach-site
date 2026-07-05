import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderBlogEmailHtml } from "./blog-email-template";
import { BLOG_EMAIL_CTA_URL, BLOG_EMAIL_MAILING_ADDRESS } from "./constants";
import { buildUnsubscribeUrl, signUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";

describe("blog email template", () => {
  it("renders week content into the locked template", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";

    const html = renderBlogEmailHtml({
      content: {
        week: 1,
        subject: "Test subject",
        headline: "Test Headline",
        teaserHtml: "<p>First paragraph.</p><p>Second paragraph.</p>",
        blogUrl: "https://www.sermoncoach.online/blog/test",
      },
      unsubscribeUrl: buildUnsubscribeUrl("reader@example.com"),
    });

    assert.match(html, /Test Headline/);
    assert.match(html, /First paragraph/);
    assert.match(html, /Run an evaluation/);
    assert.match(html, new RegExp(BLOG_EMAIL_CTA_URL.replaceAll("/", "\\/")));
    assert.match(html, /Built by Dr\. Christopher Daukas · Phoenix, Arizona/);
    assert.match(html, new RegExp(BLOG_EMAIL_MAILING_ADDRESS.replaceAll(".", "\\.")));
    assert.match(html, /Read the full post/);
    assert.match(html, /Unsubscribe/);
    assert.match(html, /\/unsubscribe\?token=/);
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips a signed token", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
    const token = signUnsubscribeToken("Reader@Example.com");
    assert.equal(verifyUnsubscribeToken(token), "reader@example.com");
  });
});
