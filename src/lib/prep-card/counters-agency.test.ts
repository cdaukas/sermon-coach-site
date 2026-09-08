import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alignmentImbalanceFlag,
  UDPIPE_SPACY_CALIBRATION,
} from "./udpipe";
import {
  christAgencyDetail,
  measureChristAgencyInPoint,
  measureChristAgencyInProse,
} from "./counters-agency";

describe("UDPipe Christ agency (C1 / C2)", () => {
  it("marks Christ as agent when he is nsubj of an action verb", async () => {
    const detail = await christAgencyDetail(
      "Christ carried every sin you have committed. The blood of Christ covers us.",
    );
    assert.equal(detail.christMentions, 2);
    assert.equal(detail.christSubj, 1);
    assert.ok(detail.agencyShare != null && detail.agencyShare > 0);
    assert.equal(await measureChristAgencyInProse(
      "Christ carried every sin you have committed.",
    ), true);
  });

  it("does not count copular Christ subjects as agency", async () => {
    const detail = await christAgencyDetail(
      "Christ is the hope of glory for every believer in the room.",
    );
    assert.ok(detail.christMentions >= 1);
    assert.equal(detail.christSubj, 0);
  });

  it("detects Christ as agent in a numbered main point (C2)", async () => {
    const body = [
      "Opening prose that is long enough to look like a manuscript body.",
      "",
      "1. Christ carried the suffering you cannot carry",
      "2. Trust God in the waiting season",
      "3. Praise God in the morning light",
      "",
      "Closing prose continues with full sentences that end cleanly.",
    ].join("\n");
    assert.equal(await measureChristAgencyInPoint(body), true);
  });

  it("returns null for C2 on transcript intake", async () => {
    assert.equal(
      await measureChristAgencyInPoint("Christ carried the load.", "youtube"),
      null,
    );
  });
});

describe("UDPipe↔spaCy alignment imbalance flag", () => {
  it("is quiet on the calibrated nearly-balanced 21/20 split", () => {
    assert.equal(
      alignmentImbalanceFlag(
        UDPIPE_SPACY_CALIBRATION.spacyOnly,
        UDPIPE_SPACY_CALIBRATION.udpipeOnly,
      ),
      null,
    );
  });

  it("flags a material one-sided skew", () => {
    const note = alignmentImbalanceFlag(40, 5);
    assert.ok(note);
    assert.match(note!, /imbalance/i);
  });
});
