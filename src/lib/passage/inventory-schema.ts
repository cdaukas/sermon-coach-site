import { z } from "zod";

/** Current inventory prompt contract. Bump when the inventory prompt changes. */
export const PASSAGE_INVENTORY_PROMPT_VERSION = "v1";

/** Generation model for passage inventories (exegetical judgment). */
export const PASSAGE_INVENTORY_MODEL = "claude-opus-4-8";

/** Comparison harness model (Sonnet is sufficient for omission/overreach read). */
export const PASSAGE_DIFF_MODEL = "claude-sonnet-4-6";

export const contestedCruxSchema = z.object({
  crux: z.string().min(1),
  positions: z.array(z.string().min(1)).min(1),
  why_it_matters: z.string().min(1),
});

export const originalLanguageTermSchema = z.object({
  term: z.string().min(1),
  gloss: z.string().min(1),
  semantic_range: z.string().min(1),
  overreach_risk: z.string().min(1),
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

export type PassageInventoryRow = PassageInventoryFields & {
  id: string;
  passage_ref_raw: string;
  passage_ref_normalized: string;
  model: string;
  prompt_version: string;
  created_at: string;
};

/** Count discrete inventory items for CSV `inventory_items`. */
export function countInventoryItems(fields: PassageInventoryFields): number {
  return (
    1 + // argument
    1 + // hinge
    fields.load_bearing.length +
    fields.contested_cruxes.length +
    fields.original_language_terms.length +
    fields.redemptive_elements.length +
    1 // burden
  );
}
