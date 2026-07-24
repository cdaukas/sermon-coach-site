import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveConfirmNextPath,
  safeRedirectPath,
  unwrapAuthCallbackNext,
} from "./confirm-redirect";

describe("safeRedirectPath", () => {
  it("accepts relative paths including nested claim query", () => {
    assert.equal(safeRedirectPath("/start?claim=abc-123"), "/start?claim=abc-123");
    assert.equal(safeRedirectPath("/update-password"), "/update-password");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    assert.equal(
      safeRedirectPath("https://evil.example/phish"),
      "/dashboard",
    );
    assert.equal(safeRedirectPath("//evil.example/phish"), "/dashboard");
    assert.equal(safeRedirectPath(null), "/dashboard");
  });
});

describe("unwrapAuthCallbackNext", () => {
  it("extracts inner next from www callback emailRedirectTo", () => {
    const raw =
      "https://www.sermoncoach.online/auth/callback?next=%2Fstart%3Fclaim%3Dabc-123";
    assert.equal(unwrapAuthCallbackNext(raw), "/start?claim=abc-123");
  });

  it("extracts inner next from apex host", () => {
    const raw =
      "https://sermoncoach.online/auth/callback?next=%2Fcheckout%3Fplan%3Dcoach%26cadence%3Dmonthly";
    assert.equal(
      unwrapAuthCallbackNext(raw),
      "/checkout?plan=coach&cadence=monthly",
    );
  });

  it("falls back to pathname+search when inner next is absent", () => {
    assert.equal(
      unwrapAuthCallbackNext("https://www.sermoncoach.online/start?claim=abc"),
      "/start?claim=abc",
    );
  });

  it("rejects foreign hosts", () => {
    assert.equal(
      unwrapAuthCallbackNext(
        "https://evil.example/auth/callback?next=%2Fstart%3Fclaim%3Dx",
      ),
      null,
    );
  });

  it("rejects non-URLs", () => {
    assert.equal(unwrapAuthCallbackNext("/start?claim=abc"), null);
    assert.equal(unwrapAuthCallbackNext(""), null);
  });
});

describe("resolveConfirmNextPath", () => {
  it("unwraps then applies safeRedirectPath", () => {
    assert.equal(
      resolveConfirmNextPath(
        "https://www.sermoncoach.online/auth/callback?next=%2Fstart%3Fclaim%3Dtok",
      ),
      "/start?claim=tok",
    );
  });

  it("defaults safely when unwrap rejects the host", () => {
    assert.equal(
      resolveConfirmNextPath(
        "https://evil.example/auth/callback?next=%2Fstart%3Fclaim%3Dtok",
      ),
      "/dashboard",
    );
  });
});
