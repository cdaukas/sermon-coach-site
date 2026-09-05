import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  measure4ConclusionFinished,
  measure7HasReciprocalAsk,
  reciprocalImperativeHits,
  terminalResidue,
} from "./counters-parser";
import { measure6ChristInPoint } from "./counters-measure6";
import {
  hasFrameBreak,
  headPattern,
  measure5OutlineHomogeneous,
  outlinePoints,
} from "./counters-frame";
import { measure12AddressesNonChristian } from "./counters-address";
import { landingZone } from "./landing-zone";

describe("measure 4 / TRD", () => {
  it("treats a prose ending as finished", () => {
    const body = Array.from({ length: 40 }, (_, i) =>
      `Paragraph ${i + 1} continues with a full sentence that lands somewhere.`,
    ).join("\n\n");
    const ending =
      "\n\nSo the church leaves with a clear word. Christ has done what we could not. Go in peace.";
    assert.equal(measure4ConclusionFinished(body + ending), true);
    assert.equal(terminalResidue(body + ending), 0);
  });

  it("returns null on flattened transcript input", () => {
    const flat = `${"word ".repeat(500)}`.trim();
    assert.equal(measure4ConclusionFinished(flat), null);
  });
});

describe("measure 5 / Frame-Break", () => {
  it("extracts numbered outline points", () => {
    const cleaned =
      "INTRO\n\n1. Consider who you are\n2. Consider what you have\n3. Consider who Christ is\n\nAPPLICATION:\n\nGo.";
    assert.deepEqual(outlinePoints(cleaned), [
      "1. Consider who you are",
      "2. Consider what you have",
      "3. Consider who Christ is",
    ]);
  });

  it("flags a singleton that breaks the majority frame", () => {
    const points = [
      "1. Consider who you are",
      "2. Consider what you have",
      "3. The cost of belonging",
    ];
    assert.equal(headPattern(points[0]!), "imperative");
    assert.equal(headPattern(points[2]!), "noun_phrase");
    assert.equal(hasFrameBreak(points), true);
  });

  it("treats a homogeneous imperative outline as a hit", () => {
    const manuscript = [
      "Opening prose that is long enough to look like a manuscript body.",
      "",
      "1. Consider who you are",
      "2. Consider what you have",
      "3. Consider who Christ is",
      "",
      "Closing prose continues with full sentences that end cleanly.",
    ].join("\n");
    assert.equal(measure5OutlineHomogeneous(manuscript), true);
  });

  it("returns null on transcripts", () => {
    const flat = `${"word ".repeat(500)}`.trim();
    assert.equal(measure5OutlineHomogeneous(flat), null);
  });
});

describe("measure 7 / RI", () => {
  it("counts reciprocal imperatives", () => {
    const text =
      "Open with welcome.\n\nEncourage one another this week. Pray for the person next to you.\n\nAmen.";
    assert.ok(reciprocalImperativeHits(text) >= 1);
    assert.equal(measure7HasReciprocalAsk(text), true);
  });

  it("is false when no reciprocal object sits near an imperative", () => {
    const text =
      "Remember the gospel. Trust him. Believe the promise. Rest in Christ alone.";
    assert.equal(measure7HasReciprocalAsk(text), false);
  });
});

describe("measure 6 stub", () => {
  it("always returns null", () => {
    assert.equal(measure6ChristInPoint("Jesus saves the lost."), null);
  });
});

describe("measure 12 / non-Christian address", () => {
  it("detects an explicit address to the unbeliever", () => {
    const text =
      "Brothers, hold fast. And if you are here and you do not yet believe, hear this: Christ is faithful over the house.";
    assert.equal(measure12AddressesNonChristian(text), true);
  });

  it("is false when the room is addressed as already believing", () => {
    const text =
      "Church, remember who you are in Christ. Trust him. Encourage one another this week.";
    assert.equal(measure12AddressesNonChristian(text), false);
  });
});

describe("landing zone", () => {
  it("prefers an APPLICATION heading", () => {
    const raw =
      "Intro prose here.\n\nPoint one.\n\nAPPLICATION:\n\nEncourage one another.\n\nClose.";
    const zone = landingZone(raw);
    assert.equal(zone.source, "heading");
    assert.match(zone.text, /Encourage one another/);
  });
});
