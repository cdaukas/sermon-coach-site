/**
 * Criterion verdict_line pass — summarization only.
 * Never scores. Never sees the evaluation prompt or rubric.
 */

export const VERDICT_LINE_MODEL = "claude-haiku-4-5";

/** Inclusive word-count band for a verdict sentence after normalize. */
export const VERDICT_LINE_MIN_WORDS = 12;
export const VERDICT_LINE_MAX_WORDS = 18;

export type VerdictLineCriterionInput = {
  id: number;
  name: string;
  score: number;
  narrative: string;
  anchored_quote: { text: string; approximate_location: string } | null;
};

export function buildVerdictLineSystemPrompt(): string {
  return `You write one collapsed-row verdict sentence per sermon-evaluation criterion.

This is summarization, not judgment. The narratives already contain the verdict. Compress them into one sentence in the same register as the criterion narrative — prose a person would speak, not telegram English. Keep articles and connectives. You do not score. You do not invent critiques absent from the narrative.

COPY CONTRACT (every line must obey all):

1. One complete grammatical sentence ending with a period. Target twelve to eighteen words (eighteen is a hard ceiling). Subject and verb must agree (singular head → singular verb: "reversal detonates," not "reversal detonate").
2. Name something specific from THIS sermon. A line that would fit any sermon is a failed line.
3. Mirror the narrative's clause shape. When the narrative already pivots on a cost or foil, a hinged line (but / though / while / yet, semicolon, or comma-plus-conjunction) is often the cleanest compress — use that hinge when it is already load-bearing. When the narrative is a single affirming clause with no named cost half, a single-clause takeaway is correct; do not invent a second half or fail the line for lacking one.
4. When a hinge is available, let it carry the score grammar (load-bearing contrast or concession):
   - High scores (5, and often 4 when affirming): contrast — the strength stands against a clear foil when the narrative names one.
   - Mid scores (3–4): concession — the strength holds, but a named cost remains when the narrative has that cost.
   - Low scores (1–2): lead with the problem; any credit second when the narrative has both.
   A preacher who sees a hinge can often read the band from the connective before the number — use that when the narrative gives you the material.
5. Elision between clauses is allowed; elision within one clause is not. Write "named, but not pressed" — never "named not pressed."
6. No score restated, no band adjective. The row already shows N/5. "Strong textual work" is wasted words.
7. Present tense, about the sermon, not about the preacher. Name what the sermon did, not what "you" did.
8. House rules: no em-dashes, no exclamation points. Use a semicolon or a comma where an em-dash wants to go.
9. Name what the narrative *concludes*, not how it *opens*. The sentence is the takeaway a reader would keep after finishing the paragraph — not a preview or near-paraphrase of the first sentence. Do not reuse the narrative's opening clause, first hinge, or first named object-in-same-order as a free clip. Distill after the argument lands.
10. Name what the sermon did or did not do — never what the preacher should do next. Prescription (fixes, moves earlier, "must stay audible," "earns its place when…") belongs in the growth edge / coaching narrative, not in verdict_line. Test: if the sentence contains "must," "should," "would," or an imperative aimed at the preacher, rewrite it as an observed cost or shortfall already present in the narrative. When a concession half is present, rephrase that cost as observation (asserted rather than shown; outruns the quoted word; buried as sub-material) — do not swap observation for instruction.

Structure-only examples (do not copy content):
- The servant and son distinction is exegetically grounded, and the text opens on that hinge with real care.
- The servant and son distinction is exegetically grounded, but the Greek is asserted rather than shown.
- Propitiation is handled with care, but the therapon claim outruns the word the sermon actually quotes.
- The gospel drives the argument rather than arriving as an add-on after the main climb is done.
- A clear spine holds the room, but the transitions announce movement instead of creating it.
- The Lion-Lamb reversal detonates as the text's own structural hinge in the close.

Failed shapes (do not write these):
- The Lion-Lamb reversal detonate as the text's own hinge. (subject-verb disagreement)
- …but the word study earns its place when tied back to the sermon's main claim. (prescription)
- …but the drift problem must stay audible inside the identity material. (must / instruction)
- …but one concrete drift-scenario moves earlier to deepen the arc. (imperative rewrite of the sermon)

When an anchored_quote is provided, prefer its specific nouns when they sharpen the sentence. The verdict must still work from the narrative alone.

Return exactly one sentence per criterion id supplied, via the tool.`;
}

export function buildVerdictLineUserMessage(
  criteria: VerdictLineCriterionInput[],
): string {
  const blocks = criteria.map((c) => {
    const quote =
      c.anchored_quote?.text?.trim()
        ? `Anchored quote (${c.anchored_quote.approximate_location}): "${c.anchored_quote.text.trim()}"`
        : "Anchored quote: (none)";
    return [
      `Criterion ${c.id}: ${c.name} (score ${c.score}/5 — compress the narrative's verdict only; never restate the number)`,
      quote,
      `Narrative: ${c.narrative.trim()}`,
      "Write the takeaway after the narrative ends — not a restatement of how it opens.",
    ].join("\n");
  });

  const count = criteria.length;
  const countPhrase =
    count === 11
      ? "each of the following eleven criteria"
      : `each of the following ${count} criteria (repair pass — rewrite only these ids)`;
  const returnPhrase =
    count === 11
      ? "Return all eleven, keyed by id, in a single tool call."
      : `Return exactly these ${count} ids in a single tool call (other ids will be ignored).`;

  return [
    `Write one complete verdict sentence for ${countPhrase}.`,
    `Twelve to eighteen words each, hard max eighteen. ${returnPhrase}`,
    "",
    blocks.join("\n\n"),
  ].join("\n");
}

/** Build a quality-retry note naming what each invalid line fell short of. */
export function buildVerdictLineQualityRetryNote(
  issues: Array<{
    id: number;
    score: number;
    reason: string;
    detail: string;
    line: string;
  }>,
): string {
  const ids = [...new Set(issues.map((i) => i.id))].sort((a, b) => a - b);
  const bullets = issues.map((issue) => {
    const preview =
      issue.line.length > 100
        ? `${issue.line.slice(0, 97)}...`
        : issue.line;
    if (issue.reason === "incomplete_grammatical_tail") {
      return `Criterion ${issue.id} (score ${issue.score}/5): previous line ends mid-thought (${issue.detail}). Finish as one complete sentence. Failed line: "${preview}"`;
    }
    if (issue.reason === "subject_verb_agreement") {
      return `Criterion ${issue.id} (score ${issue.score}/5): ${issue.detail}. Fix agreement so singular subjects take a singular verb form (e.g. reversal detonates, not reversal detonate). Failed line: "${preview}"`;
    }
    return `Criterion ${issue.id} (score ${issue.score}/5): ${issue.detail}. Failed line: "${preview}"`;
  });

  return [
    `RETRY (targeted criteria ${ids.join(", ")} only):`,
    "Rewrite only the listed ids. Observe what fell short — do not invent new critiques.",
    "Every line must parse as one complete sentence with subject-verb agreement.",
    "A single-clause line is fine when the narrative has no cost half — do not invent a hinge.",
    "When the narrative already has a pivot, a hinged compress is welcome but not mandatory for acceptance.",
    "",
    ...bullets,
  ].join("\n");
}
