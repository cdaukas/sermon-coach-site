import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveStatuses,
  SKETCH_PROMPT_VERSION,
  telemetryForPersist,
  type SketchTelemetry,
} from "./generate";

describe("sketch generate module", () => {
  it("exports the shared prompt version used by both routes", () => {
    assert.equal(SKETCH_PROMPT_VERSION, "v2.11");
  });

  it("forces seam.hub area to seam and demotes solid spokes to thin", () => {
    const input: SketchTelemetry = {
      mode: "find",
      seam_hub: "points",
      seam_spokes: ["gospel_turn", "ache"],
      status_points: "solid",
      status_gospel_turn: "solid",
      status_ache: "thin",
      status_big_idea: "solid",
    };
    const out = deriveStatuses(input);
    assert.equal(out.status_points, "seam");
    assert.equal(out.status_gospel_turn, "thin");
    assert.equal(out.status_ache, "thin");
    assert.equal(out.status_big_idea, "solid");
    assert.equal(out.status_demotions?.length, 2);
    assert.deepEqual(
      out.status_demotions?.map((d) => d.rule).sort(),
      ["seam_disagrees_with", "seam_hub"],
    );
  });

  it("leaves existing seam spokes alone", () => {
    const out = deriveStatuses({
      mode: "find",
      seam_hub: "ending",
      seam_spokes: ["one_person"],
      status_ending: "seam",
      status_one_person: "seam",
    });
    assert.equal(out.status_ending, "seam");
    assert.equal(out.status_one_person, "seam");
    assert.equal(out.status_demotions, undefined);
  });

  it("demotes solid press.area to thin in press mode", () => {
    const out = deriveStatuses({
      mode: "press",
      press_area: "ending",
      status_ending: "solid",
      status_big_idea: "solid",
      status_one_person: "thin",
    });
    assert.equal(out.status_ending, "thin");
    assert.equal(out.status_big_idea, "solid");
    assert.equal(out.status_demotions?.length, 1);
    assert.equal(out.status_demotions?.[0]?.rule, "press_area");
    assert.equal(out.status_demotions?.[0]?.area, "ending");
  });

  it("strips demotions and press_area from persist / client telemetry", () => {
    const out = deriveStatuses({
      mode: "press",
      press_area: "points",
      status_points: "solid",
    });
    const persist = telemetryForPersist(out);
    assert.equal("status_demotions" in persist, false);
    assert.equal("press_area" in persist, false);
    assert.equal(persist.status_points, "thin");
  });
});
