import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderBlogEmailHtml } from "./blog-email-template";
import { BLOG_EMAIL_CTA_URL, BLOG_EMAIL_MAILING_ADDRESS } from "./constants";
import { buildUnsubscribePostUrl, buildUnsubscribeUrl, signUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";

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
    assert.match(html, /Built by Dr\. Christopher M\. Daukas · Phoenix, Arizona/);
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

  it("builds a human URL and a same-host one-click POST URL", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
    const human = buildUnsubscribeUrl("reader@example.com");
    const post = buildUnsubscribePostUrl("reader@example.com");

    assert.match(human, /^https:\/\/www\.sermoncoach\.online\/unsubscribe\?token=/);
    assert.match(post, /^https:\/\/www\.sermoncoach\.online\/api\/unsubscribe\?token=/);

    const humanToken = new URL(human).searchParams.get("token");
    const postToken = new URL(post).searchParams.get("token");
    assert.ok(humanToken);
    assert.equal(humanToken, postToken);
    assert.equal(verifyUnsubscribeToken(humanToken), "reader@example.com");
  });
});
