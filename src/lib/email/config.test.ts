import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_REPLY_TO,
  getEmailFromAddress,
  getEmailReplyTo,
  isEmailConfigured,
} from "./config";

describe("email config", () => {
  const originalFrom = process.env.RESEND_FROM;
  const originalReplyTo = process.env.RESEND_REPLY_TO;
  const originalApiKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalFrom === undefined) {
      delete process.env.RESEND_FROM;
    } else {
      process.env.RESEND_FROM = originalFrom;
    }

    if (originalReplyTo === undefined) {
      delete process.env.RESEND_REPLY_TO;
    } else {
      process.env.RESEND_REPLY_TO = originalReplyTo;
    }

    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  it("uses sermoncoach.online defaults when env is unset", () => {
    delete process.env.RESEND_FROM;
    delete process.env.RESEND_REPLY_TO;

    assert.equal(getEmailFromAddress(), DEFAULT_EMAIL_FROM);
    assert.equal(getEmailReplyTo(), DEFAULT_REPLY_TO);
    assert.match(DEFAULT_EMAIL_FROM, /sermoncoach\.online/);
  });

  it("reads optional sender overrides from env", () => {
    process.env.RESEND_FROM = "Custom <hello@sermoncoach.online>";
    process.env.RESEND_REPLY_TO = "support@sermoncoach.online";

    assert.equal(getEmailFromAddress(), "Custom <hello@sermoncoach.online>");
    assert.equal(getEmailReplyTo(), "support@sermoncoach.online");
  });

  it("reports configured only when RESEND_API_KEY is set", () => {
    delete process.env.RESEND_API_KEY;
    assert.equal(isEmailConfigured(), false);

    process.env.RESEND_API_KEY = "re_test_key";
    assert.equal(isEmailConfigured(), true);

    process.env.RESEND_API_KEY = "   ";
    assert.equal(isEmailConfigured(), false);
  });
});
