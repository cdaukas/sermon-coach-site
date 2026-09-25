import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEEP_DIVE_MAX_SERMONS,
  DEEP_DIVE_MIN_SERMONS,
  DEEP_DIVE_PRESELECT,
  DEEP_DIVE_SMALL_SAMPLE_BELOW,
  deepDiveThresholdProse,
} from "./deep-dive-threshold";
import {
  deepDiveLockLines,
  deepDiveOpensAt,
  deepDiveSelectionBlock,
  deepDiveSmallSampleLine,
  deepDiveUnlock,
  formatDeepDiveGenreLine,
  formatDeepDiveTally,
  isDeepDiveQuarterLocked,
  preselectedDeepDiveIds,
} from "./deep-dive-dashboard";

const RAN = new Date("2026-09-14T15:00:00.000Z");

describe("deep dive quarter", () => {
  it("opens a rolling quarter later, on the same day", () => {
    const opens = deepDiveOpensAt(RAN);
    assert.equal(opens.toISOString(), "2026-12-14T15:00:00.000Z");
    assert.equal(isDeepDiveQuarterLocked(RAN, new Date("2026-12-14T14:59:00.000Z")), true);
    assert.equal(isDeepDiveQuarterLocked(RAN, opens), false);
    assert.equal(isDeepDiveQuarterLocked(null, RAN), false);
  });

  it("names the theme and both dates", () => {
    const lines = deepDiveLockLines({
      themeId: "ask",
      generatedAt: RAN,
      now: new Date("2026-09-20T00:00:00.000Z"),
    });
    assert.equal(
      lines.ranLine,
      "You ran The ask on 14 September. Your next deep dive opens 14 December.",
    );
    assert.match(lines.prepCardLine, /prep card is always available/);
  });
});

describe("deep dive unlock", () => {
  it("reads the shared threshold", () => {
    const unlock = deepDiveUnlock(9);
    assert.ok(unlock);
    assert.equal(
      unlock.headline,
      `Your first deep dive opens at ${deepDiveThresholdProse("en")} sermons.`,
    );
    assert.equal(unlock.countLabel, `9 of ${DEEP_DIVE_MIN_SERMONS}`);
    assert.equal(unlock.filled, 9);
    assert.equal(unlock.total, DEEP_DIVE_MIN_SERMONS);
    assert.equal(unlock.remainder, "Three more and you can run your first report.");
  });

  it("is absent once the threshold is met", () => {
    assert.equal(deepDiveUnlock(DEEP_DIVE_MIN_SERMONS), null);
    assert.equal(deepDiveUnlock(DEEP_DIVE_MIN_SERMONS + 4), null);
  });

  it("speaks a single sermon still to go", () => {
    const unlock = deepDiveUnlock(DEEP_DIVE_MIN_SERMONS - 1);
    assert.equal(unlock?.remainder, "One more and you can run your first report.");
    assert.equal(unlock?.countLabel, `${DEEP_DIVE_MIN_SERMONS - 1} of ${DEEP_DIVE_MIN_SERMONS}`);
  });
});

describe("deep dive picker", () => {
  it("preselects the newest window and no more", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `s${i}`);
    const selected = preselectedDeepDiveIds(ids);
    assert.equal(selected.length, DEEP_DIVE_PRESELECT);
    assert.equal(selected[0], "s0");
  });

  it("says why a selection cannot generate", () => {
    assert.equal(
      deepDiveSelectionBlock(DEEP_DIVE_MIN_SERMONS - 1),
      `Select at least ${DEEP_DIVE_MIN_SERMONS} sermons.`,
    );
    assert.equal(
      deepDiveSelectionBlock(DEEP_DIVE_MAX_SERMONS + 1),
      `Select at most ${DEEP_DIVE_MAX_SERMONS} sermons.`,
    );
    assert.equal(deepDiveSelectionBlock(DEEP_DIVE_MIN_SERMONS), null);
    assert.equal(deepDiveSelectionBlock(DEEP_DIVE_MAX_SERMONS), null);
  });

  it("states the manuscript split and the genre mix without restricting", () => {
    const tally = formatDeepDiveTally([
      ...Array.from({ length: 14 }, () => ({
        format: "manuscript" as const,
        genre: "epistle" as const,
      })),
      ...Array.from({ length: 4 }, () => ({
        format: "transcript" as const,
        genre: "ot_narrative" as const,
      })),
    ]);
    assert.equal(tally, "18 selected · 14 manuscripts, 4 transcripts");
    assert.equal(
      formatDeepDiveGenreLine([
        ...Array.from({ length: 8 }, () => "epistle" as const),
        ...Array.from({ length: 4 }, () => "ot_narrative" as const),
        "unknown",
      ]),
      "Mostly epistles (8) and Old Testament narrative (4)",
    );
  });
});

describe("deep dive small sample", () => {
  it("uses the unlock word at the threshold and digits otherwise", () => {
    assert.equal(
      deepDiveSmallSampleLine(DEEP_DIVE_MIN_SERMONS),
      `Built from ${deepDiveThresholdProse("en")} sermons. Counts move a lot at this size, and a measure that looks weak may need another quarter before they become more concrete.`,
    );
    assert.match(deepDiveSmallSampleLine(14) ?? "", /Built from 14 sermons/);
  });

  it("appears below eighteen sermons and not at eighteen", () => {
    assert.ok(deepDiveSmallSampleLine(DEEP_DIVE_SMALL_SAMPLE_BELOW - 1));
    assert.equal(deepDiveSmallSampleLine(DEEP_DIVE_SMALL_SAMPLE_BELOW), null);
    assert.equal(deepDiveSmallSampleLine(24), null);
  });
});
