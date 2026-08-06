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

1. One complete sentence ending with a period. Target twelve to eighteen words (eighteen is a hard ceiling).
2. Name something specific from THIS sermon. A line that would fit any sermon is a failed line.
3. Two-part structure with a hinge. Almost every good line pivots. Both halves required below a 5.
4. The hinge carries the score (load-bearing):
   - High scores (5, and often 4 when affirming): contrast — the strength stands against a clear foil. A pure 5 may be a single affirming sentence when the narrative names no cost; scores 1–4 never drop the second half.
   - Mid scores (3–4): concession — the strength holds, but a named cost remains.
   - Low scores (1–2): lead with the problem; any credit second.
   - Copy contract for every score below 5: state both (a) what the sermon did and (b) what kept it from the next rung — as observation, not instruction. A single-clause line with no second half is a failed line on any score below 5.
   A preacher learns the grammar in one report and can read his score off the connective before the number.
5. Elision between clauses is allowed; elision within one clause is not. Write "named, but not pressed" — never "named not pressed."
6. No score restated, no band adjective. The row already shows N/5. "Strong textual work" is wasted words.
7. Present tense, about the sermon, not about the preacher. Name what the sermon did, not what "you" did.
8. House rules: no em-dashes, no exclamation points. Use a semicolon or a comma where an em-dash wants to go.
9. Name what the narrative *concludes*, not how it *opens*. The sentence is the takeaway a reader would keep after finishing the paragraph — not a preview or near-paraphrase of the first sentence. Do not reuse the narrative's opening clause, first hinge, or first named object-in-same-order as a free clip. Distill after the argument lands.
10. Concession names what the sermon did or did not do — never what the preacher should do next. Prescription (fixes, moves earlier, "must stay audible," "earns its place when…") belongs in the growth edge / coaching narrative, not in verdict_line. Test: if the second half contains "must," "should," "would," or an imperative aimed at the preacher, rewrite it as an observed cost or shortfall already present in the narrative. Do not drop the concession half to avoid prescription — rephrase the cost as observation (asserted rather than shown; outruns the quoted word; buried as sub-material) so both halves remain.

Structure-only examples (do not copy content):
- The servant and son distinction is exegetically grounded, and the text opens on that hinge with real care.
- The servant and son distinction is exegetically grounded, but the Greek is asserted rather than shown.
- Propitiation is handled with care, but the therapon claim outruns the word the sermon actually quotes.
- The gospel drives the argument rather than arriving as an add-on after the main climb is done.
- A clear spine holds the room, but the transitions announce movement instead of creating it.

Failed shapes (do not write these):
- The servant and son distinction is exegetically grounded. (single clause on a score below 5 — missing the cost half)
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
      `Criterion ${c.id}: ${c.name} (score ${c.score}/5 — use the hinge grammar for this band only; never restate the number)`,
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
    if (issue.reason === "missing_hinge") {
      return `Criterion ${issue.id} (score ${issue.score}/5): previous line was single-clause with no second half. Missing hinge half naming the observed cost or foil (not prescription). Failed line: "${preview}"`;
    }
    if (issue.reason === "subject_verb_agreement") {
      return `Criterion ${issue.id} (score ${issue.score}/5): ${issue.detail}. Fix agreement so singular subjects take a singular verb form. Failed line: "${preview}"`;
    }
    return `Criterion ${issue.id} (score ${issue.score}/5): ${issue.detail}. Failed line: "${preview}"`;
  });

  return [
    `RETRY (targeted criteria ${ids.join(", ")} only):`,
    "Rewrite only the listed ids. Observe what fell short — do not invent new critiques.",
    "Scores below 5 require both halves with a hinge (but/though/while/yet, semicolon, or comma-plus-conjunction).",
    "Score 5 may stay single affirming clause when the narrative names no cost.",
    "Every line must have subject-verb agreement (e.g. reversal detonates, not reversal detonate).",
    "",
    ...bullets,
  ].join("\n");
}
