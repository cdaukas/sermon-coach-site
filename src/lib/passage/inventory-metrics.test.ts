import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeDiffItems, type DiffItemResult } from "./diff-prompt";
import {
  applyDefaultInventoryWeights,
  countInventoryItems,
  flattenInventoryItems,
  passageInventoryFieldsSchema,
} from "./inventory-schema";

const sample = passageInventoryFieldsSchema.parse({
  argument: "The Son is greater than Moses.",
  hinge: "if indeed we hold fast",
  load_bearing: ["hothen", "therapon"],
  contested_cruxes: [
    {
      crux: "the conditional in 3:6",
      positions: ["evidence of true house", "condition of remaining"],
      why_it_matters: "assurance vs perseverance framing",
    },
  ],
  original_language_terms: [
    {
      term: "therapon",
      gloss: "servant",
      semantic_range: "honored household servant, not doulos",
      overstatement_risk: "nobility/rank",
      understatement_risk: "lowly slave contrast",
    },
  ],
  redemptive_elements: ["Christ as apostle and high priest"],
  burden: "drifting hearts that fail to hold confidence",
});

describe("inventory weights (passage-alone)", () => {
  it("assigns load_bearing to argument/hinge/burden/crux and available to terms/phrases", () => {
    const weighted = applyDefaultInventoryWeights(sample);
    assert.equal(weighted.contested_cruxes[0].weight, "load_bearing");
    assert.equal(weighted.contested_cruxes[0].weight_source, "inventory");
    assert.equal(weighted.original_language_terms[0].weight, "available");
    assert.equal(
      weighted.original_language_terms[0].overstatement_risk,
      "nobility/rank",
    );
    assert.equal(
      weighted.original_language_terms[0].understatement_risk,
      "lowly slave contrast",
    );

    const flat = flattenInventoryItems(weighted);
    const byType = Object.fromEntries(
      flat.map((f) => [f.id, f]),
    ) as Record<string, (typeof flat)[0]>;
    assert.equal(byType.argument.weight, "load_bearing");
    assert.equal(byType.hinge.weight, "load_bearing");
    assert.equal(byType.burden.weight, "load_bearing");
    assert.equal(byType["crux:0"].weight, "load_bearing");
    assert.equal(byType["load_bearing:0"].weight, "available");
    assert.equal(byType["term:0"].weight, "available");
    assert.equal(byType["redemptive:0"].weight, "available");
    assert.equal(countInventoryItems(weighted), flat.length);
  });
});

describe("summarizeDiffItems", () => {
  it("counts crux mentioned_only as unaddressed and keeps non-crux binary", () => {
    const items: DiffItemResult[] = [
      {
        item_id: "crux:0",
        item_type: "contested_crux",
        label: "v6 conditional",
        weight: "load_bearing",
        weight_assigned_by: "inventory",
        engagement: "mentioned_only",
      },
      {
        item_id: "crux:1",
        item_type: "contested_crux",
        label: "v4 builder",
        weight: "load_bearing",
        weight_assigned_by: "inventory",
        engagement: "engaged",
      },
      {
        item_id: "term:0",
        item_type: "original_language_term",
        label: "katanoeo",
        weight: "available",
        weight_assigned_by: "inventory",
        addressed: false,
      },
      {
        item_id: "hinge",
        item_type: "hinge",
        label: "hinge",
        weight: "load_bearing",
        weight_assigned_by: "inventory",
        addressed: true,
      },
    ];
    const m = summarizeDiffItems(items);
    assert.equal(m.crux_engaged, 1);
    assert.equal(m.crux_mentioned_only, 1);
    assert.equal(m.crux_absent, 0);
    // mentioned_only crux + unaddressed available term
    assert.equal(m.items_unaddressed, 2);
    // load-bearing unaddressed: only the mentioned_only crux (term is available)
    assert.equal(m.load_bearing_unaddressed, 1);
    assert.equal(m.load_bearing_items, 3);
  });
});
