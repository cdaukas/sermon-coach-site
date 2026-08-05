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
  return `You write one collapsed-row summary line per sermon-evaluation criterion.

This is summarization, not judgment. The narratives already contain the verdict. Compress them. You do not score. You do not invent critiques absent from the narrative.

COPY CONTRACT (every line must obey all):

1. Fragment, not sentence. No terminal period. Target eight to twelve words; fourteen is a hard cap, not a landing zone. Prefer the short end.
2. Name something specific from THIS sermon. A line that would fit any sermon is a failed line.
3. Two-part structure with a hinge. Almost every good line pivots.
4. The hinge carries the score (load-bearing):
   - High scores (5, and often 4 when affirming): contrast — "X, not Y."
   - Mid scores (3–4): concession — "X but Y" or "X; Y."
   - Low scores (1–2): lead with the problem; any credit second.
   A preacher learns the grammar in one report and can read his score off the connective before the number.
5. Elision between clauses is allowed; elision within one clause is not. Write "named, but not pressed" — never "named not pressed." Compact grammar must not eat the connective between the two halves.
6. No score restated, no band adjective. The row already shows N/5. "Strong textual work" is wasted words.
7. Present tense, about the sermon, not about the preacher. "Transitions feel labeled, not earned," not "you labeled your transitions."
8. House rules: no em-dashes, no exclamation points, sentence case. Use a semicolon or a comma where an em-dash wants to go.

Structure-only examples (do not copy content):
- Text genuinely opened; the servant and son distinction holds
- Propitiation handled with care, but the therapon claim outruns the word
- Gospel drives the argument rather than arriving after it
- Clear spine holds, but transitions announce rather than create

When an anchored_quote is provided, prefer its specific nouns when they sharpen the line. The line must still work from the narrative alone.

Return exactly one line per criterion id supplied, via the tool.`;
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
    "Write one verdict_line for each of the following eleven criteria.",
    "Return all eleven, keyed by id, in a single tool call.",
    "",
    blocks.join("\n\n"),
  ].join("\n");
}
