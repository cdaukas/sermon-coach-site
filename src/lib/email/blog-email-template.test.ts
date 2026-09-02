import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  renderBlogEmailHtml,
  renderUpdateEmailHtml,
} from "./blog-email-template";
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
    assert.match(html, /Built by Dr\. Christopher M\. Daukas · Phoenix, Arizona/);
    assert.match(html, new RegExp(BLOG_EMAIL_MAILING_ADDRESS.replaceAll(".", "\\.")));
    assert.match(html, /Read the full post/);
    assert.match(html, /Unsubscribe/);
    assert.match(html, /from these emails/);
    assert.doesNotMatch(html, /from weekly blog emails/);
    assert.match(html, /\/unsubscribe\?token=/);
  });
});

describe("update email template", () => {
  it("reuses the shell without teaser chrome", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
    const unsubscribeUrl = buildUnsubscribeUrl("reader@example.com");

    const html = renderUpdateEmailHtml({
      title: "Improvements to The Sermon Coach",
      headline: "What changed",
      bodyHtml:
        '<p>Intro.</p><p><a href="https://sermoncoach.com/start">Start</a></p><p><a href="https://sermoncoach.com/pricing.html">Pricing</a></p><p><a href="https://sermoncoach.com/how-its-scored.html">How it\'s scored</a></p><p><a href="https://sermoncoach.com/sample-evaluation">Sample evaluation</a></p><p><a href="https://sermoncoach.com/sample-sketch">Sample sketch</a></p>',
      unsubscribeUrl,
    });

    assert.match(html, /What changed/);
    assert.match(html, /The Sermon <span style="color:#a67c2e;">Coach<\/span>™/);
    assert.match(html, /from these emails/);
    assert.match(html, /\/unsubscribe\?token=/);
    assert.match(html, /https:\/\/sermoncoach\.com\/start/);
    assert.match(html, /https:\/\/sermoncoach\.com\/pricing\.html/);
    assert.match(html, /https:\/\/sermoncoach\.com\/how-its-scored\.html/);
    assert.match(html, /https:\/\/sermoncoach\.com\/sample-evaluation/);
    assert.match(html, /https:\/\/sermoncoach\.com\/sample-sketch/);
    assert.doesNotMatch(html, /This week on the blog/);
    assert.doesNotMatch(html, /Read the full post/);
    assert.doesNotMatch(html, /Run an evaluation/);
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips a signed token", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
    const token = signUnsubscribeToken("Reader@Example.com");
    assert.equal(verifyUnsubscribeToken(token), "reader@example.com");
  });
});
