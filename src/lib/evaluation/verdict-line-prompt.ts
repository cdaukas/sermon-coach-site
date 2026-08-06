/**
 * Criterion verdict_line pass — summarization only.
 * Never scores. Never sees the evaluation prompt or rubric.
 */

export const VERDICT_LINE_MODEL = "claude-haiku-4-5";

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

1. One complete sentence ending with a period. Target twelve to eighteen words.
2. Name something specific from THIS sermon. A line that would fit any sermon is a failed line.
3. Two-part structure with a hinge. Almost every good line pivots.
4. The hinge carries the score (load-bearing):
   - High scores (5, and often 4 when affirming): contrast — the strength stands against a clear foil.
   - Mid scores (3–4): concession — the strength holds, but a named cost remains.
   - Low scores (1–2): lead with the problem; any credit second.
   A preacher learns the grammar in one report and can read his score off the connective before the number.
5. Elision between clauses is allowed; elision within one clause is not. Write "named, but not pressed" — never "named not pressed."
6. No score restated, no band adjective. The row already shows N/5. "Strong textual work" is wasted words.
7. Present tense, about the sermon, not about the preacher. Name what the sermon did, not what "you" did.
8. House rules: no em-dashes, no exclamation points. Use a semicolon or a comma where an em-dash wants to go.

Structure-only examples (do not copy content):
- The servant and son distinction is exegetically grounded, and the text opens on that hinge with real care.
- Propitiation is handled with care, but the therapon claim outruns the word the sermon actually quotes.
- The gospel drives the argument rather than arriving as an add-on after the main climb is done.
- A clear spine holds the room, but the transitions announce movement instead of creating it.

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
    ].join("\n");
  });

  return [
    "Write one complete verdict sentence for each of the following eleven criteria.",
    "Return all eleven, keyed by id, in a single tool call.",
    "",
    blocks.join("\n\n"),
  ].join("\n");
}
