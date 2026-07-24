import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SKETCH_PROMPT_VERSION } from "./generate";

describe("sketch generate module", () => {
  it("exports the shared prompt version used by both routes", () => {
    assert.equal(SKETCH_PROMPT_VERSION, "v2.10");
  });
});
