import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkSignupBotGate } from "./signup-bot-gate";

describe("checkSignupBotGate", () => {
  it("allows a normal email with empty honeypot", () => {
    const result = checkSignupBotGate("pastor@church.org", "");
    assert.deepEqual(result, { ok: true });
  });

  it("rejects heavy-dotted Gmail with the generic invalid_email message", () => {
    const result = checkSignupBotGate("a.b.c.d.e@gmail.com", "");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "invalid_email");
      assert.equal(result.message, "Please enter a valid email address");
    }
  });

  it("rejects a filled honeypot without revealing the rule", () => {
    const result = checkSignupBotGate(
      "pastor@church.org",
      "https://spam.example",
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "invalid_email");
      assert.equal(result.message, "Please enter a valid email address");
    }
  });
});
