import type {
  FlattenedInventoryItem,
  PassageInventoryFields,
} from "./inventory-schema";
import { flattenInventoryItems } from "./inventory-schema";

/**
 * Diff model result. Contested cruxes use engagement trichotomy;
 * all other item types use binary addressed.
 */
export type DiffItemResult = {
  item_id: string;
  item_type: FlattenedInventoryItem["type"];
  label: string;
  /**
   * Final weight used for metrics. May be elevated from inventory `available`
   * to `load_bearing` when the sermon makes a claim about the item.
   */
  weight: "load_bearing" | "available";
  /** Who set the final weight. */
  weight_assigned_by: "inventory" | "diff_promotion";
  /**
   * Non-crux only: binary. Absent for contested_crux (use engagement instead).
   */
  addressed?: boolean;
  /**
   * Contested_crux only:
   * - engaged: interpretive question named, OR sermon position identified as a position, OR flagged assertion without alternatives
   * - mentioned_only: text appears but crux not engaged
   * - absent: no appearance
   */
  engagement?: "engaged" | "mentioned_only" | "absent";
  note?: string;
};

export type DiffModelResult = {
  summary: string;
  item_results: DiffItemResult[];
  overreach_correctly_flagged: Array<{
    claim_or_risk: string;
    how_eval_handled: string;
  }>;
  overreach_missed: Array<{
    claim_or_risk: string;
    evaluation_problem: string;
  }>;
};

export function buildDiffSystemPrompt(): string {
  return `You compare a passage-first inventory (ground truth about the TEXT) against a stored sermon evaluation (judgment of a SERMON). Your job is measurement, not coaching.

You receive a pre-flattened item list. Every item has an id, type, inventory weight, and detail. Judge EACH item once. Do not invent extra items.

## Two addressability standards (do not mix them)

### A. Contested cruxes only (type = contested_crux)

Use a three-way engagement judgment:

- \`engaged\` — the evaluation either (1) names the interpretive question, or (2) identifies the sermon's reading as a *position* (a choice among live readings), or (3) flags that the sermon asserted one reading without acknowledging an alternative. Naming live positions from the inventory, or refusing to treat a contested claim as simply correct, counts as engaged.
- \`mentioned_only\` — the text of the crux (a clause, phrase, or near paraphrase) appears in the evaluation corpus in service of some other point, but the interpretive question is not named and the sermon's take is not treated as a position. **Quoting the clause is not engagement.**
- \`absent\` — no appearance of the crux material at all.

Do NOT mark a contested crux as engaged merely because a synonym or quote appears.

### B. Every other item type (argument, hinge, burden, load_bearing_phrase, original_language_term, redemptive_element)

Binary only: \`addressed\` true or false.
- Count as addressed when the evaluation substantively engages the item OR a passing synonym covers it.
- "A passing synonym counts as addressed" applies HERE only, not to contested cruxes.

## Weight promotion

Inventory already set each item's weight to \`load_bearing\` or \`available\`.
If an item is inventory-weight \`available\` but the evaluation corpus shows the sermon made a claim about that item (used the term, leaned on the phrase, taught the element), promote it: set weight to \`load_bearing\` and weight_assigned_by to \`diff_promotion\`.
Otherwise keep inventory weight and set weight_assigned_by to \`inventory\`.

## Overreach

For original_language_terms, risks are bidirectional: \`overstatement_risk\` and \`understatement_risk\` (either may be null).
- overreach_missed: evaluation affirms a claim outside the term's semantic range in either direction, or fails to flag a risk the inventory named when the sermon appears to make that claim.
- Silence about a term the sermon never used is not an overreach miss.
- Endorsing one side of a contested crux as simply "correct" without noticing the contest is an overreach_missed when that endorsement appears.

## JSON output (strict, no fences)

{
  "summary": string,
  "item_results": [
    {
      "item_id": string,                 // must match the inventory item id
      "item_type": string,
      "label": string,
      "weight": "load_bearing" | "available",
      "weight_assigned_by": "inventory" | "diff_promotion",
      "addressed": boolean,              // REQUIRED for non-crux; omit for contested_crux
      "engagement": "engaged" | "mentioned_only" | "absent",  // REQUIRED for contested_crux only; omit otherwise
      "note": string                     // optional short justification
    }
  ],
  "overreach_correctly_flagged": [
    { "claim_or_risk": string, "how_eval_handled": string }
  ],
  "overreach_missed": [
    { "claim_or_risk": string, "evaluation_problem": string }
  ]
}

Rules:
- Every inventory item_id appears exactly once in item_results.
- Contested cruxes must have engagement and must NOT have addressed.
- Non-crux items must have addressed and must NOT have engagement.
- Be concrete; quote short evaluation phrases in notes when useful.
- Do not invent sermon claims absent from the evaluation corpus.`;
}

export function buildDiffUserMessage(input: {
  passageRef: string;
  items: FlattenedInventoryItem[];
  evaluationCorpus: string;
}): string {
  return `Passage: ${input.passageRef}

=== FLATTENED INVENTORY ITEMS ===
${JSON.stringify(input.items, null, 2)}

=== EVALUATION CORPUS ===
${input.evaluationCorpus}

Return only the JSON object.`;
}

/** Build items for the model from stored inventory fields. */
export function inventoryItemsForDiff(
  fields: PassageInventoryFields,
): FlattenedInventoryItem[] {
  return flattenInventoryItems(fields);
}

/** Flatten a stored evaluation into the corpus the diff model reads. */
export function buildEvaluationCorpus(row: {
  result: unknown;
  coaching_narrative: unknown;
  how_it_preaches?: unknown;
}): string {
  const result = row.result as Record<string, unknown> | null;
  if (!result || typeof result !== "object") {
    return "(no evaluation result)";
  }

  const lines: string[] = [];

  const meta = result.meta as Record<string, unknown> | undefined;
  if (meta?.scripture_reference) {
    lines.push(`meta.scripture_reference: ${String(meta.scripture_reference)}`);
  }

  const scoring = result.scoring as Record<string, unknown> | undefined;
  if (scoring) {
    lines.push(
      `scoring: band=${String(scoring.band ?? "?")} weighted=${String(scoring.composite_weighted ?? "?")}`,
    );
  }

  const verdict = result.verdict as Record<string, unknown> | undefined;
  if (verdict) {
    lines.push(`verdict.affirmation: ${String(verdict.affirmation ?? "")}`);
    lines.push(`verdict.improvement: ${String(verdict.improvement ?? "")}`);
  }

  const categories = result.categories as
    | Array<{
        name?: string;
        criteria?: Array<{
          name?: string;
          score?: number;
          narrative?: string;
          anchored_quote?: {
            text?: string;
            approximate_location?: string;
          } | null;
        }>;
      }>
    | undefined;

  if (Array.isArray(categories)) {
    for (const cat of categories) {
      for (const c of cat.criteria ?? []) {
        lines.push("");
        lines.push(
          `### Criterion: ${c.name ?? "?"} (${c.score ?? "?"}/5)`,
        );
        lines.push(String(c.narrative ?? ""));
        const aq = c.anchored_quote;
        if (aq?.text) {
          lines.push(
            `anchored_quote: "${aq.text}" (${aq.approximate_location ?? "loc?"})`,
          );
        }
      }
    }
  }

  const priorities = result.top_priorities as
    | Array<{
        rank?: number;
        headline?: string;
        rationale?: string;
        practical_step?: string;
      }>
    | undefined;
  if (Array.isArray(priorities)) {
    lines.push("");
    lines.push("### top_priorities");
    for (const p of priorities) {
      lines.push(
        `#${p.rank}: ${p.headline ?? ""}\n${p.rationale ?? ""}\n${p.practical_step ?? ""}`,
      );
    }
  }

  const working = result.whats_working as
    | Array<{ headline?: string; explanation?: string }>
    | undefined;
  if (Array.isArray(working)) {
    lines.push("");
    lines.push("### whats_working");
    for (const w of working) {
      lines.push(`${w.headline ?? ""}: ${w.explanation ?? ""}`);
    }
  }

  const rewrites = result.rewrites as
    | Array<{ moment_label?: string; analysis?: string }>
    | undefined;
  if (Array.isArray(rewrites)) {
    lines.push("");
    lines.push("### rewrites");
    for (const r of rewrites) {
      lines.push(`${r.moment_label ?? ""}: ${r.analysis ?? ""}`);
    }
  }

  const hip = row.how_it_preaches;
  if (hip != null) {
    lines.push("");
    lines.push("### how_it_preaches");
    try {
      lines.push(
        typeof hip === "string" ? hip : JSON.stringify(hip, null, 2),
      );
    } catch {
      lines.push(String(hip));
    }
  }

  const coaching = row.coaching_narrative as Record<string, unknown> | null;
  if (coaching && typeof coaching === "object") {
    const grow = coaching.how_to_grow as
      | { edge?: string; this_week?: string }
      | undefined;
    if (grow) {
      lines.push("");
      lines.push("### coaching_narrative.how_to_grow");
      lines.push(`edge: ${grow.edge ?? ""}`);
      lines.push(`this_week: ${grow.this_week ?? ""}`);
    }
  }

  return lines.join("\n");
}

/** Derive CSV / rate metrics from validated item results. */
export function summarizeDiffItems(itemResults: DiffItemResult[]): {
  inventory_items: number;
  load_bearing_items: number;
  items_unaddressed: number;
  load_bearing_unaddressed: number;
  crux_engaged: number;
  crux_mentioned_only: number;
  crux_absent: number;
} {
  let unaddressed = 0;
  let loadBearing = 0;
  let loadBearingUnaddressed = 0;
  let cruxEngaged = 0;
  let cruxMentioned = 0;
  let cruxAbsent = 0;

  for (const item of itemResults) {
    const isLoadBearing = item.weight === "load_bearing";
    if (isLoadBearing) loadBearing += 1;

    if (item.item_type === "contested_crux") {
      if (item.engagement === "engaged") cruxEngaged += 1;
      else if (item.engagement === "mentioned_only") {
        cruxMentioned += 1;
        unaddressed += 1;
        if (isLoadBearing) loadBearingUnaddressed += 1;
      } else if (item.engagement === "absent") {
        cruxAbsent += 1;
        unaddressed += 1;
        if (isLoadBearing) loadBearingUnaddressed += 1;
      }
      continue;
    }

    if (item.addressed === false) {
      unaddressed += 1;
      if (isLoadBearing) loadBearingUnaddressed += 1;
    }
  }

  return {
    inventory_items: itemResults.length,
    load_bearing_items: loadBearing,
    items_unaddressed: unaddressed,
    load_bearing_unaddressed: loadBearingUnaddressed,
    crux_engaged: cruxEngaged,
    crux_mentioned_only: cruxMentioned,
    crux_absent: cruxAbsent,
  };
}
