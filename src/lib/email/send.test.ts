import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { sendTransactionalEmail } from "./send";

describe("sendTransactionalEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  it("skips send when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendTransactionalEmail({
      to: "pastor@church.org",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.skipped, true);
      assert.match(result.error, /not configured/i);
    }
  });
});
