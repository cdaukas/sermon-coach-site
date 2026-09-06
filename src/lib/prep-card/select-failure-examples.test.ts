import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SermonApplicationCoding } from "./counters-coding";
import {
  quoteDedupeKey,
  selectFocusFailureExamples,
} from "./select-failure-examples";

const SHARED =
  "Where God has enabled you to be generous, thank God.";
const DISTINCT_COST =
  "Give until it costs you something this week.";
const DISTINCT_OBJECT =
  "Write one name and call them before Friday.";

function sermon(id: string, title: string, body: string) {
  return {
    id,
    title,
    content: `APPLICATION\n\n${body}\n\nAmen.`,
  };
}

describe("selectFocusFailureExamples dedupe", () => {
  it("does not reuse one quote across measure 2 and 3", () => {
    const sermons = [
      sermon(
        "s1",
        "Test Acts 4",
        `${SHARED} ${DISTINCT_COST} ${DISTINCT_OBJECT}`,
      ),
    ];
    const askCoding: SermonApplicationCoding[] = [
      {
        sermonId: "s1",
        namedObject: false,
        namedCost: false,
        asks: [
          {
            quote: SHARED,
            named_object: false,
            named_cost: false,
          },
          {
            quote: DISTINCT_COST,
            named_object: true,
            named_cost: false,
          },
          {
            quote: DISTINCT_OBJECT,
            named_object: false,
            named_cost: true,
          },
        ],
      },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [3, 2],
      sermons,
      askCoding,
    });

    assert.equal(examples.length, 2);
    assert.equal(examples[0]!.measureId, 3);
    assert.equal(examples[0]!.quote, SHARED);
    assert.equal(examples[1]!.measureId, 2);
    assert.equal(examples[1]!.quote, DISTINCT_OBJECT);
    assert.notEqual(
      quoteDedupeKey(examples[0]!.quote),
      quoteDedupeKey(examples[1]!.quote),
    );
  });

  it("omits a later measure when every failing ask is already used", () => {
    const sermons = [sermon("s1", "Only one", SHARED)];
    const askCoding: SermonApplicationCoding[] = [
      {
        sermonId: "s1",
        namedObject: false,
        namedCost: false,
        asks: [
          {
            quote: SHARED,
            named_object: false,
            named_cost: false,
          },
        ],
      },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [3, 2],
      sermons,
      askCoding,
    });

    assert.equal(examples.length, 1);
    assert.equal(examples[0]!.measureId, 3);
    assert.equal(examples[0]!.quote, SHARED);
  });

  it("measure 7 only selects coded asks, never staging notes", () => {
    const staging =
      "Hold onto those pesos — they're coming back later in this sermon";
    const privateAsk = "Confess your sin before God this week.";
    const sermons = [
      sermon("s1", "Acts", `${staging}\n\n${privateAsk}`),
    ];
    const askCoding: SermonApplicationCoding[] = [
      {
        sermonId: "s1",
        namedObject: false,
        namedCost: false,
        asks: [
          {
            quote: privateAsk,
            named_object: false,
            named_cost: false,
          },
        ],
      },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [7],
      sermons,
      askCoding,
    });

    assert.equal(examples.length, 1);
    assert.equal(examples[0]!.quote, privateAsk);
    assert.equal(examples[0]!.marker, "reciprocal");
    assert.notEqual(examples[0]!.quote, staging);
  });

  it("measure 7 omits Was/Now when no coded ask fails reciprocal", () => {
    const reciprocalAsk =
      "Confess that sin to your brother in this church before you leave.";
    const sermons = [sermon("s1", "Acts", reciprocalAsk)];
    const askCoding: SermonApplicationCoding[] = [
      {
        sermonId: "s1",
        namedObject: true,
        namedCost: false,
        asks: [
          {
            quote: reciprocalAsk,
            named_object: true,
            named_cost: false,
          },
        ],
      },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [7],
      sermons,
      askCoding,
    });

    assert.equal(examples.length, 0);
  });

  it("measure 4 uses final two sentences, not a file header", () => {
    const body = Array.from({ length: 40 }, (_, i) =>
      `Paragraph ${i + 1} continues with a full sentence that lands somewhere.`,
    ).join("\n\n");
    const header =
      "Hebrews 3:1–6 — “The House”\nTrinity Bible Church · [DATE] · [SERVICE]\nGround-up rebuild — v3";
    const unfinished =
      `${header}\n\n${body}\n\n` +
      "ILLUSTRATION\nXXXX\nADD\n\nSo the church leaves unfinished.";
    const sermons = [
      { id: "h1", title: "Hebrews - Ground Up", content: unfinished },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [4],
      sermons,
      askCoding: [],
    });

    assert.ok(examples.length <= 1);
    if (examples.length === 1) {
      assert.equal(examples[0]!.measureId, 4);
      assert.equal(examples[0]!.marker, null);
      assert.doesNotMatch(examples[0]!.quote, /\[DATE\]/);
      assert.doesNotMatch(examples[0]!.quote, /Ground-up rebuild/);
    }
  });

  it("measure 4 omits Was/Now when the only long span is a file header", () => {
    const headerOnly =
      "Hebrews 3:1–6 — “The House”\nTrinity Bible Church · [DATE] · [SERVICE]\nGround-up rebuild — v3\n\nXXXX\nADD\nILL";
    const sermons = [
      { id: "h2", title: "Header only", content: headerOnly },
    ];

    const examples = selectFocusFailureExamples({
      focusIds: [4],
      sermons,
      askCoding: [],
    });

    assert.equal(examples.length, 0);
  });
});
