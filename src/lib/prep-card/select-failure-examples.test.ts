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
});
