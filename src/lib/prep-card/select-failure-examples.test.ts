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
    assert.equal(examples[0]!.primary.measureId, 3);
    assert.equal(examples[0]!.primary.quote, SHARED);
    assert.equal(examples[1]!.primary.measureId, 2);
    assert.equal(examples[1]!.primary.quote, DISTINCT_OBJECT);
    assert.notEqual(
      quoteDedupeKey(examples[0]!.primary.quote),
      quoteDedupeKey(examples[1]!.primary.quote),
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
    assert.equal(examples[0]!.primary.measureId, 3);
    assert.equal(examples[0]!.primary.quote, SHARED);
    assert.equal(examples[0]!.also.length, 0);
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
    assert.equal(examples[0]!.primary.quote, privateAsk);
    assert.equal(examples[0]!.primary.marker, "reciprocal");
    assert.equal(examples[0]!.also.length, 0);
    assert.notEqual(examples[0]!.primary.quote, staging);
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

  it("ask measure keeps one primary and up to three also quotes", () => {
    const asks = [
      "Trust God more this week with your schedule.",
      "Believe harder when the week feels thin.",
      "Remember that God is with you on Monday.",
      "Lean on grace when the inbox piles up.",
      "Rest in the promise without naming a cost.",
    ];
    const sermons = [
      sermon("s1", "One", asks[0]!),
      sermon("s2", "Two", asks[1]!),
      sermon("s3", "Three", asks[2]!),
      sermon("s4", "Four", asks[3]!),
      sermon("s5", "Five", asks[4]!),
    ];
    const askCoding: SermonApplicationCoding[] = sermons.map((row, i) => ({
      sermonId: row.id,
      namedObject: false,
      namedCost: false,
      asks: [
        {
          quote: asks[i]!,
          named_object: true,
          named_cost: false,
        },
      ],
    }));

    const examples = selectFocusFailureExamples({
      focusIds: [3],
      sermons,
      askCoding,
    });

    assert.equal(examples.length, 1);
    assert.equal(examples[0]!.primary.quote, asks[0]);
    assert.equal(examples[0]!.also.length, 3);
    assert.deepEqual(
      examples[0]!.also.map((row) => row.quote),
      asks.slice(1, 4),
    );
    const all = [examples[0]!.primary, ...examples[0]!.also];
    const keys = all.map((row) => quoteDedupeKey(row.quote));
    assert.equal(new Set(keys).size, keys.length);
  });

  it("measure 4 uses final two sentences, not a file header, and has no also list", () => {
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
      assert.equal(examples[0]!.primary.measureId, 4);
      assert.equal(examples[0]!.primary.marker, null);
      assert.equal(examples[0]!.also.length, 0);
      assert.doesNotMatch(examples[0]!.primary.quote, /\[DATE\]/);
      assert.doesNotMatch(examples[0]!.primary.quote, /Ground-up rebuild/);
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
