import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuthCallbackUrl } from "@/lib/billing/checkout";
import {
  emailRedirectNextPath,
  START_PATH,
  startPathWithClaim,
  startPathWithNext,
} from "./start";

describe("emailRedirectNextPath", () => {
  it("returns mentor accept path flat — no /start?next= wrap", () => {
    const accept = "/mentor/accept?token=tok-1";
    assert.equal(emailRedirectNextPath({ inviteNext: accept }), accept);
  });

  it("returns start?claim= for sketch tokens", () => {
    assert.equal(
      emailRedirectNextPath({ claimToken: "claim-1" }),
      startPathWithClaim("claim-1"),
    );
  });

  it("prefers invite over claim", () => {
    assert.equal(
      emailRedirectNextPath({
        inviteNext: "/mentor/accept?token=tok",
        claimToken: "claim-1",
      }),
      "/mentor/accept?token=tok",
    );
  });

  it("defaults to /start", () => {
    assert.equal(emailRedirectNextPath({}), START_PATH);
  });
});

describe("emailRedirect encoding depth (invite signup)", () => {
  it("callback next encodes once so / is %2F not %252F or %25252F", () => {
    const accept = "/mentor/accept?token=tok-1";
    const next = emailRedirectNextPath({ inviteNext: accept });
    const callback = buildAuthCallbackUrl("https://www.sermoncoach.online", next);
    const nextParam = new URL(callback).searchParams.get("next");
    assert.equal(nextParam, accept);
    assert.ok(callback.includes("%2Fmentor%2Faccept"));
    assert.equal(callback.includes("%252F"), false);
    assert.equal(callback.includes("%25252F"), false);
  });

  it("documents the broken wrap that over-encoded (regress only)", () => {
    const accept = "/mentor/accept?token=tok-1";
    const nested = startPathWithNext(accept);
    const broken = buildAuthCallbackUrl("https://www.sermoncoach.online", nested);
    // Nested wrap yields %252F (double). A third hop yields %25252F — the
    // production failure. Never reintroduce nesting into emailRedirectTo.
    assert.ok(broken.includes("%252F"));
    assert.equal(broken.includes("%25252F"), false);
  });
});
