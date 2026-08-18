import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withCaptchaToken } from "./captcha";

describe("withCaptchaToken", () => {
  it("adds captchaToken when a token is present", () => {
    assert.deepEqual(withCaptchaToken({ emailRedirectTo: "/start" }, "tok_abc"), {
      emailRedirectTo: "/start",
      captchaToken: "tok_abc",
    });
  });

  it("omits captchaToken when the token is empty", () => {
    assert.deepEqual(withCaptchaToken({ emailRedirectTo: "/start" }, "  "), {
      emailRedirectTo: "/start",
    });
  });
});
