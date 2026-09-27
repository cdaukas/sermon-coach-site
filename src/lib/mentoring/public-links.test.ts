import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  APPRENTICE_SEAT_CHECKOUT_PATH,
  CLASSROOM_PATH,
  COLLEAGUE_SEAT_CHECKOUT_PATH,
  OWN_PREACHING_PATH,
} from "./public-links";

describe("public mentoring links", () => {
  it("points seat buttons at the existing checkout routes", () => {
    assert.equal(APPRENTICE_SEAT_CHECKOUT_PATH, "/checkout?seat=debrief");
    assert.equal(COLLEAGUE_SEAT_CHECKOUT_PATH, "/checkout?seat=evaluation");
    assert.equal(CLASSROOM_PATH, "/pricing.html#classroom");
    assert.equal(OWN_PREACHING_PATH, "/pricing.html");
  });

  it("names only the two seat prices on the public page", () => {
    const page = readFileSync(
      new URL("../../app/mentoring/page.tsx", import.meta.url),
      "utf8",
    );
    const amounts = page.match(/\$\d+(?:\.\d+)?/g) ?? [];
    assert.deepEqual([...new Set(amounts)].sort(), ["$12", "$25"]);
  });
});
