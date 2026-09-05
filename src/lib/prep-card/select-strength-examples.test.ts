import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  finalTwoSentences,
  selectStrengthExamples,
} from "./select-strength-examples";
import type { SermonApplicationCoding } from "./counters-coding";
import type { SermonNamingCoding } from "./counters-naming";

describe("finalTwoSentences", () => {
  it("returns the last two sentence spans", () => {
    const text =
      "First sentence here. Second sentence here. Third lands cleanly.";
    assert.equal(
      finalTwoSentences(text),
      "Second sentence here. Third lands cleanly.",
    );
  });
});

describe("selectStrengthExamples", () => {
  it("returns two verified ask hits for measure 2 from different sermons", () => {
    const sermons = [
      {
        id: "a",
        title: "Alpha",
        content:
          "APPLICATION\n\nWrite one name and call them before Friday. Amen.",
      },
      {
        id: "b",
        title: "Beta",
        content:
          "APPLICATION\n\nMove from once a month to twice a month. Amen.",
      },
    ];
    const askCoding: SermonApplicationCoding[] = [
      {
        sermonId: "a",
        namedObject: true,
        namedCost: false,
        asks: [
          {
            quote: "Write one name and call them before Friday.",
            named_object: true,
            named_cost: false,
          },
        ],
      },
      {
        sermonId: "b",
        namedObject: true,
        namedCost: false,
        asks: [
          {
            quote: "Move from once a month to twice a month.",
            named_object: true,
            named_cost: false,
          },
        ],
      },
    ];
    const namingCoding: SermonNamingCoding[] = [];

    const examples = selectStrengthExamples({
      strengthIds: [2],
      sermons,
      askCoding,
      namingCoding,
    });

    assert.equal(examples.length, 2);
    assert.equal(examples[0]!.measureId, 2);
    assert.equal(examples[0]!.kind, "quote");
    assert.notEqual(examples[0]!.sermonId, examples[1]!.sermonId);
  });

  it("stores point heads for measure 5 strengths", () => {
    const body = [
      "1. Trust God in the waiting",
      "2. Obey God in the dark",
      "3. Praise God in the morning",
      "",
      "Closing prose continues with full sentences that end cleanly.",
      "Another finished sentence closes the page.",
    ].join("\n");
    const sermons = [
      { id: "m1", title: "Manuscript One", content: body },
      {
        id: "m2",
        title: "Manuscript Two",
        content: [
          "1. Seek the kingdom first",
          "2. Leave tomorrow alone",
          "3. Ask for daily bread",
          "",
          "Closing prose continues with full sentences that end cleanly.",
          "Another finished sentence closes the page.",
        ].join("\n"),
      },
    ];

    const examples = selectStrengthExamples({
      strengthIds: [5],
      sermons,
      askCoding: [],
      namingCoding: [],
    });

    assert.ok(examples.length >= 1);
    assert.equal(examples[0]!.kind, "point_heads");
    assert.ok((examples[0]!.heads?.length ?? 0) >= 3);
  });

  it("stores final two sentences for measure 4 strengths", () => {
    const finished = Array.from({ length: 8 }, (_, i) =>
      `Paragraph ${i + 1} continues with a full sentence that lands somewhere.`,
    ).join("\n\n");
    const ending =
      "The gospel holds when nothing else does. Rest there this week.";
    const sermons = [
      {
        id: "c1",
        title: "Close One",
        content: `${finished}\n\n${ending}`,
      },
      {
        id: "c2",
        title: "Close Two",
        content: `${finished}\n\nChrist is enough for this room. Walk out under that.`,
      },
    ];

    const examples = selectStrengthExamples({
      strengthIds: [4],
      sermons,
      askCoding: [],
      namingCoding: [],
    });

    assert.equal(examples.length, 2);
    assert.equal(examples[0]!.kind, "closing_sentences");
    assert.match(examples[0]!.quote, /\./);
    assert.notEqual(examples[0]!.sermonId, examples[1]!.sermonId);
  });
});
