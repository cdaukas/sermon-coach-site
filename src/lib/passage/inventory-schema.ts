import { z } from "zod";

/**
 * Inventory prompt contract. Bump when inventory shape or prompt material
 * changes (v2: bidirectional term risks + inventory weights).
 */
export const PASSAGE_INVENTORY_PROMPT_VERSION = "v2";

/** Generation model for passage inventories (exegetical judgment). */
export const PASSAGE_INVENTORY_MODEL = "claude-opus-4-8";

/** Comparison harness model (Sonnet is sufficient for omission/overreach read). */
export const PASSAGE_DIFF_MODEL = "claude-sonnet-4-6";

export const itemWeightSchema = z.enum(["load_bearing", "available"]);
export type ItemWeight = z.infer<typeof itemWeightSchema>;

export const weightSourceSchema = z.enum(["inventory", "diff_promotion"]);
export type WeightSource = z.infer<typeof weightSourceSchema>;

export const contestedCruxSchema = z.object({
  crux: z.string().min(1),
  positions: z.array(z.string().min(1)).min(1),
  why_it_matters: z.string().min(1),
  /** Always load_bearing from inventory assignment. Optional on model raw output. */
  weight: itemWeightSchema.optional(),
  weight_source: weightSourceSchema.optional(),
});

export const originalLanguageTermSchema = z.object({
  term: z.string().min(1),
  gloss: z.string().min(1),
  semantic_range: z.string().min(1),
  /** Overstating the sense (e.g. nobility/rank). Null when no overstatement risk. */
  overstatement_risk: z.string().nullable(),
  /** Understating the sense (e.g. lowly slave). Null when no understatement risk. */
  understatement_risk: z.string().nullable(),
  weight: itemWeightSchema.optional(),
  weight_source: weightSourceSchema.optional(),
});

/** Model output / column payload (without id, refs, model, timestamps). */
export const passageInventoryFieldsSchema = z.object({
  argument: z.string().min(1),
  hinge: z.string().min(1),
  load_bearing: z.array(z.string().min(1)).min(1),
  contested_cruxes: z.array(contestedCruxSchema).min(1),
  original_language_terms: z.array(originalLanguageTermSchema).min(1),
  redemptive_elements: z.array(z.string().min(1)).min(1),
  burden: z.string().min(1),
});

export type PassageInventoryFields = z.infer<typeof passageInventoryFieldsSchema>;

export type ContestedCrux = z.infer<typeof contestedCruxSchema>;
export type OriginalLanguageTerm = z.infer<typeof originalLanguageTermSchema>;

export type PassageInventoryRow = {
  id: string;
  passage_ref_raw: string;
  passage_ref_normalized: string;
  argument: string | null;
  hinge: string | null;
  load_bearing: string[] | null;
  contested_cruxes: ContestedCrux[] | null;
  original_language_terms: OriginalLanguageTerm[] | null;
  redemptive_elements: string[] | null;
  burden: string | null;
  model: string;
  prompt_version: string;
  created_at: string;
};

export type InventoryItemType =
  | "argument"
  | "hinge"
  | "burden"
  | "load_bearing_phrase"
  | "contested_crux"
  | "original_language_term"
  | "redemptive_element";

/** Flattened inventory unit for measurement. */
export type FlattenedInventoryItem = {
  id: string;
  type: InventoryItemType;
  /** Short label for reports / model. */
  label: string;
  /** Full payload the model should judge. */
  detail: string;
  weight: ItemWeight;
  weight_source: WeightSource;
};

/**
 * Passage-alone default weights (no sermon).
 * load_bearing: argument, hinge, burden, contested_cruxes
 * available: load_bearing phrases, original-language terms, redemptive_elements
 */
export function applyDefaultInventoryWeights(
  fields: PassageInventoryFields,
): PassageInventoryFields {
  return {
    ...fields,
    contested_cruxes: fields.contested_cruxes.map((c) => ({
      ...c,
      weight: "load_bearing" as const,
      weight_source: "inventory" as const,
    })),
    original_language_terms: fields.original_language_terms.map((t) => ({
      ...t,
      weight: "available" as const,
      weight_source: "inventory" as const,
      overstatement_risk: t.overstatement_risk ?? null,
      understatement_risk: t.understatement_risk ?? null,
    })),
  };
}

/** Flatten stored/weighted inventory into discrete measurement items. */
export function flattenInventoryItems(
  fields: PassageInventoryFields,
): FlattenedInventoryItem[] {
  const weighted = applyDefaultInventoryWeights(fields);
  const items: FlattenedInventoryItem[] = [];

  items.push({
    id: "argument",
    type: "argument",
    label: "argument",
    detail: weighted.argument,
    weight: "load_bearing",
    weight_source: "inventory",
  });

  items.push({
    id: "hinge",
    type: "hinge",
    label: "hinge",
    detail: weighted.hinge,
    weight: "load_bearing",
    weight_source: "inventory",
  });

  items.push({
    id: "burden",
    type: "burden",
    label: "burden",
    detail: weighted.burden,
    weight: "load_bearing",
    weight_source: "inventory",
  });

  weighted.load_bearing.forEach((text, i) => {
    items.push({
      id: `load_bearing:${i}`,
      type: "load_bearing_phrase",
      label: text,
      detail: text,
      weight: "available",
      weight_source: "inventory",
    });
  });

  weighted.contested_cruxes.forEach((c, i) => {
    items.push({
      id: `crux:${i}`,
      type: "contested_crux",
      label: c.crux,
      detail: JSON.stringify({
        crux: c.crux,
        positions: c.positions,
        why_it_matters: c.why_it_matters,
      }),
      weight: c.weight ?? "load_bearing",
      weight_source: c.weight_source ?? "inventory",
    });
  });

  weighted.original_language_terms.forEach((t, i) => {
    items.push({
      id: `term:${i}`,
      type: "original_language_term",
      label: t.term,
      detail: JSON.stringify({
        term: t.term,
        gloss: t.gloss,
        semantic_range: t.semantic_range,
        overstatement_risk: t.overstatement_risk,
        understatement_risk: t.understatement_risk,
      }),
      weight: t.weight ?? "available",
      weight_source: t.weight_source ?? "inventory",
    });
  });

  weighted.redemptive_elements.forEach((text, i) => {
    items.push({
      id: `redemptive:${i}`,
      type: "redemptive_element",
      label: text,
      detail: text,
      weight: "available",
      weight_source: "inventory",
    });
  });

  return items;
}

export function countInventoryItems(fields: PassageInventoryFields): number {
  return flattenInventoryItems(fields).length;
}

export function countLoadBearingItems(fields: PassageInventoryFields): number {
  return flattenInventoryItems(fields).filter((i) => i.weight === "load_bearing")
    .length;
}
