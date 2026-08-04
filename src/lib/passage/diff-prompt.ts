import type { PassageInventoryFields } from "./inventory-schema";

export type DiffModelResult = {
  summary: string;
  omissions: Array<{ item: string; where_should_appear: string }>;
  /** Inventory overreach risks the evaluation already flagged or refused to affirm. */
  overreach_correctly_flagged: Array<{
    claim_or_risk: string;
    how_eval_handled: string;
  }>;
  /**
   * Evaluation affirms a claim the inventory does not support, or fails to flag
   * a claim the inventory marks as an overreach risk.
   */
  overreach_missed: Array<{
    claim_or_risk: string;
    evaluation_problem: string;
  }>;
};

export function buildDiffSystemPrompt(): string {
  return `You compare a passage-first inventory (ground truth about the TEXT) against a stored sermon evaluation (judgment of a SERMON). Your job is measurement, not coaching.

Answer two questions only:

1. OMISSION. Which inventory items does the evaluation never address — not in any criterion narrative, not in top_priorities, not in the verdict, not in any growth edge / coaching narrative supplied?
2. OVERREACH. Does the evaluation affirm any claim the inventory does not support, or fail to flag a claim the inventory marks as an overreach risk?

Return strict JSON only. No preamble, no markdown fences.

JSON shape:
{
  "summary": string,  // one or two sentences
  "omissions": [
    { "item": string, "where_should_appear": string }
  ],
  "overreach_correctly_flagged": [
    { "claim_or_risk": string, "how_eval_handled": string }
  ],
  "overreach_missed": [
    { "claim_or_risk": string, "evaluation_problem": string }
  ]
}

Rules:
- Only count an omission when the inventory item is substantively unaddressed. A passing synonym counts as addressed.
- Overreach_missed: high bar — the evaluation must affirm the bad claim, or soft-pedal a risk the inventory named. Silence on a term the sermon never used is not an overreach miss.
- Do not invent sermon claims not present in the evaluation excerpts.
- Be concrete; quote short evaluation phrases when useful.`;
}

export function buildDiffUserMessage(input: {
  passageRef: string;
  inventory: PassageInventoryFields;
  evaluationCorpus: string;
}): string {
  return `Passage: ${input.passageRef}

=== PASSAGE INVENTORY (text-grounded; no sermon) ===
${JSON.stringify(input.inventory, null, 2)}

=== EVALUATION CORPUS (criterion narratives, priorities, verdict, growth edges) ===
${input.evaluationCorpus}

Return only the JSON object.`;
}

/** Flatten a stored evaluation into the corpus the diff model reads. */
export function buildEvaluationCorpus(row: {
  result: unknown;
  coaching_narrative: unknown;
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
          anchored_quote?: { text?: string; approximate_location?: string } | null;
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
