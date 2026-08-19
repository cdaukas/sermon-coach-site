import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  slideIndexForElapsed,
  stageLabelForElapsed,
  timeEstimateForElapsed,
  WAIT_OVERRUN_SECONDS,
  WAIT_SLIDES,
  WAIT_STAGE_LABELS,
  WAIT_TIME_ESTIMATE,
  WAIT_TIME_OVERRUN,
  slideForElapsed,
} from "./waitStateContent";

describe("stageLabelForElapsed", () => {
  it("starts on reading the manuscript", () => {
    assert.equal(stageLabelForElapsed(0), WAIT_STAGE_LABELS[0]);
  });

  it("advances through category stages on the timer", () => {
    assert.equal(stageLabelForElapsed(12), WAIT_STAGE_LABELS[1]);
    assert.equal(stageLabelForElapsed(32), WAIT_STAGE_LABELS[2]);
    assert.equal(stageLabelForElapsed(52), WAIT_STAGE_LABELS[3]);
    assert.equal(stageLabelForElapsed(72), WAIT_STAGE_LABELS[4]);
    assert.equal(stageLabelForElapsed(92), WAIT_STAGE_LABELS[5]);
    assert.equal(stageLabelForElapsed(110), WAIT_STAGE_LABELS[6]);
  });

  it("holds on finishing after the schedule ends", () => {
    assert.equal(stageLabelForElapsed(150), WAIT_STAGE_LABELS[6]);
    assert.equal(stageLabelForElapsed(400), WAIT_STAGE_LABELS[6]);
  });
});

describe("slideIndexForElapsed", () => {
  it("shows nine slides at about thirteen seconds each", () => {
    assert.equal(WAIT_SLIDES.length, 9);
    assert.equal(slideIndexForElapsed(0), 0);
    assert.equal(slideIndexForElapsed(12), 0);
    assert.equal(slideIndexForElapsed(13), 1);
    assert.equal(slideIndexForElapsed(26), 2);
    assert.equal(slideIndexForElapsed(104), 8);
  });

  it("holds on the last slide and does not wrap", () => {
    assert.equal(slideIndexForElapsed(117), 8);
    assert.equal(slideIndexForElapsed(150), 8);
    assert.equal(slideIndexForElapsed(999), 8);
  });

  it("teaches the book-level melodic line on slide 3", () => {
    assert.equal(WAIT_SLIDES[2]?.title, "The tune the whole book is singing");
    assert.match(
      WAIT_SLIDES[2]?.body ?? "",
      /theme that holds an entire book together/,
    );
    assert.doesNotMatch(WAIT_SLIDES[2]?.body ?? "", /Every passage has one/);
    assert.doesNotMatch(WAIT_SLIDES[2]?.body ?? "", /checks both/);
    assert.match(WAIT_SLIDES[2]?.body ?? "", /does not score it/);
  });
});

describe("timeEstimateForElapsed", () => {
  it("keeps the two-minute line until the overrun threshold", () => {
    assert.equal(timeEstimateForElapsed(0), WAIT_TIME_ESTIMATE);
    assert.equal(timeEstimateForElapsed(149), WAIT_TIME_ESTIMATE);
  });

  it("swaps to the overrun message at 150 seconds while slide 9 holds", () => {
    assert.equal(WAIT_OVERRUN_SECONDS, 150);
    assert.equal(timeEstimateForElapsed(150), WAIT_TIME_OVERRUN);
    assert.equal(timeEstimateForElapsed(200), WAIT_TIME_OVERRUN);
    assert.equal(slideIndexForElapsed(150), 8);
    assert.equal(WAIT_SLIDES[slideIndexForElapsed(150)]?.title, "Start with the growth edges");
  });
});

describe("Spanish wait copy", () => {
  it("keeps the same stage and slide cadence in Spanish", () => {
    assert.equal(stageLabelForElapsed(0, "es"), "Leyendo el manuscrito...");
    assert.equal(stageLabelForElapsed(110, "es"), "Terminando tu lectura...");
    assert.equal(
      timeEstimateForElapsed(0, "es"),
      "Esto suele tardar unos dos minutos.",
    );
    assert.equal(
      timeEstimateForElapsed(150, "es"),
      "Sigue trabajando. Los manuscritos más largos tardan un poco más.",
    );
    assert.equal(slideForElapsed(0, "es").title, "Con fuente, no inventado");
    assert.equal(
      slideForElapsed(150, "es").title,
      "Empieza por los bordes de crecimiento",
    );
  });
});
