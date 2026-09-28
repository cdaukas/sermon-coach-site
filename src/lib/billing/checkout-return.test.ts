import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHECKOUT_RETURN_COOKIE,
  MENTOR_SEAT_CHECKOUT_RETURN,
  checkoutReturnMatches,
} from "./checkout-return";

describe("checkout return cookie", () => {
  it("names the cookie and the mentoring landing path", () => {
    assert.equal(CHECKOUT_RETURN_COOKIE, "sc_checkout_return");
    assert.equal(MENTOR_SEAT_CHECKOUT_RETURN, "/dashboard/develop");
  });

  it("honors the cookie only on the path it names", () => {
    assert.equal(
      checkoutReturnMatches("/dashboard/develop", "/dashboard/develop"),
      true,
    );
    assert.equal(
      checkoutReturnMatches("/dashboard", "/dashboard/develop"),
      false,
    );
    assert.equal(checkoutReturnMatches("/dashboard/develop", undefined), false);
  });
});
