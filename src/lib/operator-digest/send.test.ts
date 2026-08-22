import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { BLOG_EMAIL_FROM, RESEND_FROM } from "@/lib/email/constants";
import { OPERATOR_DIGEST_TO } from "./digest";
import { sendOperatorDigestEmail } from "./send";

describe("sendOperatorDigestEmail", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends as RESEND_FROM to Chris and never as BLOG_EMAIL_FROM", async () => {
    const captured: {
      from: string;
      to: string[];
    }[] = [];

    globalThis.fetch = (async (_url: URL | RequestInfo, init?: RequestInit) => {
      captured.push(JSON.parse(String(init?.body)) as (typeof captured)[number]);
      return new Response(JSON.stringify({ id: "re_test" }), { status: 200 });
    }) as typeof fetch;

    const result = await sendOperatorDigestEmail({
      apiKey: "re_test_key",
      subject: "Sermon Coach weekly: nothing to act on",
      html: "<p>none</p>",
    });

    assert.deepEqual(result, { ok: true, id: "re_test" });
    assert.equal(captured[0]?.from, RESEND_FROM);
    assert.notEqual(captured[0]?.from, BLOG_EMAIL_FROM);
    assert.deepEqual(captured[0]?.to, [OPERATOR_DIGEST_TO]);
    assert.equal(captured[0]?.to[0], "cdaukas@gmail.com");
  });
});
