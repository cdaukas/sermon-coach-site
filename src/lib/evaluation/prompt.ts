import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildContextPreamble, type SermonContext } from "./context";

export const EVALUATION_PROMPT_VERSION = "v3.2";

/** Rows below this prompt_version use read-grandfather verdict caps (no 60/32 on dashboard parse). */
export const VERDICT_STRICT_CAPS_FROM = "v2.3";

const rubricPath = join(process.cwd(), "src/lib/evaluation/rubric.md");

let cachedRubric: string | null = null;

export function loadRubricMarkdown(): string {
  if (!cachedRubric) {
    cachedRubric = readFileSync(rubricPath, "utf8");
  }
  return cachedRubric;
}

const STRUCTURAL_CONTRACT = `## STRUCTURAL CONTRACT (NON-NEGOTIABLE)

1. Score exactly 11 criteria in a 3+3+3+2 layout across the four canonical categories (Text & Theology, Structure & Craft, Application & Audience Connection, Ecclesial & Spiritual). Use the canonical criterion names from the rubric. Each criterion object: \`id\` (1–11), \`name\` (enum), \`category\` (1–4), \`tradition_tag\`, \`score\` (1–5), \`narrative\` (2–4 sentences of diagnostic critique with at least one direct sermon quote, then the mandatory PER-CRITERION CLOSE sentence from item 7), optional \`anchored_quote\`. Do not submit category subtotals — the app computes them.

2. Split \`verdict\` into two JSON strings — \`affirmation\` and \`improvement\` (never one combined block). HARD LIMITS (count words before submit; over-limit responses are rejected): \`verdict.affirmation\` ≤60 words (target ~50–60; ONE named strength only; slightly elevated altitude; no quotation marks; no criterion-level detail). \`verdict.improvement\` ≤32 words (target ~25–30; headline pointer with one qualifying clause — not an explanation; no quotation marks). \`top_priorities[0]\` must match \`verdict.improvement\` in substance.

3. Category dashboards are diagnostic-first. Do not add other prescriptive growth footers in per-criterion narratives beyond the mandatory PER-CRITERION CLOSE sentence in item 7 (required for every score, including 4 and 5). Do not include \`growth_opportunities\` or any per-category growth array — that field is not in the schema. Ranked, this-week prescriptive work goes in \`top_priorities\` only (length exactly 3; each item needs \`rank\`, \`headline\`, \`principle_tag\`, \`rationale\`, \`practical_step\`).

4. Set \`meta.audio_available\` from whether audio/video of the preached sermon was supplied. When \`audio_available\` is true, populate \`heat_map\` with full beat-by-beat data (\`beats\` with \`time_range\`, \`beat_label\`, \`register\`, \`text_supports\`, \`notes\`; optional \`total_minutes\`). When false (manuscript-only), set \`heat_map\` to \`null\` — no stub object, no manuscript-inferred timeline rows. Criterion #8 still scores in the rubric; its \`narrative\` carries delivery diagnostics in prose.

5. Lock section titles: "Lead with these", "Where You Can Grow", "What Improvement Looks Like". No alternatives or editorial garnish. JSON field names (\`whats_working\`, \`top_priorities\`, \`rewrites\`) describe content; titles are render-layer only.

6. Return JSON matching \`submit_sermon_evaluation\` exactly. Top-level keys (all required): \`meta\`, \`scoring\`, \`verdict\`, \`categories\`, \`heat_map\`, \`whats_working\` (3–5 cards), \`top_priorities\` (exactly 3), \`rewrites\` (1–2). \`meta\` includes \`audio_available\`. \`scoring\` includes \`composite_simple\`, \`composite_weighted\`, \`band\`, \`raw_total\`, \`raw_max\` (55) — no letter grade, no \`diagnostic_gap\`. \`categories\` is four items (3+3+3+2 criteria); each has \`id\`, \`name\`, \`number\`, \`criteria\` only. \`verdict\` is \`{ affirmation, improvement }\`. Do not include \`fcf\`, \`growth_opportunities_detailed\`, \`methodology_note\`, or per-category \`growth_opportunities\`.

7. **PER-CRITERION CLOSE** (append inside \`narrative\` for every criterion): End each criterion's narrative with ONE forward-looking sentence, scaled to its score.

- Scores 1 to 4 (climb note): Append one sentence naming what the next band up would concretely require IN THIS SERMON. Format: "To reach a [next score], [specific, sermon-anchored change]." Scale it with the score: a 1 to 2 or 2 to 3 note may name a foundational fix; a 3 to 4 note names a smaller, sharper move; a 4 to 5 note names the final increment to genuine excellence, the most refined and specific move of all, never a generic "tighten it up." A 4 is already strong, so its note must read as the last polish on good work, not as a correction. Example (3 to 4): "To reach a 4, ground the application in one concrete situation your congregation actually faces this week rather than the general call to trust." Example (4 to 5): "To reach a 5, carry the Monday-morning image from your conclusion back into the second point so the application arc is felt earlier, not only at the end."

- Score 5 (hold note): Do not invent a weakness and do not imagine a sixth band. Append one sentence naming what the preacher should keep doing to hold this strength in future sermons. Format: "To hold this, [specific, sermon-anchored practice]." Phrase it as preservation, not correction. Example: "To hold this, keep letting the text set your structure the way the three movements here grew straight out of the passage's own logic."

Rules for both notes: (a) ONE sentence, woven into the existing \`narrative\` field. Do NOT create a separate field, callout, or "Practical Step" box (that formatting belongs to Top 3 Priorities only). (b) The note POINTS tactically; it does not prescribe deeply. \`top_priorities\` remains the place for ranked, this-week prescriptive steps. If a criterion also appears in \`top_priorities\`, the note stays a one-line tactical pointer and must NOT duplicate the Priority's full prescription (different altitude). (c) Anchor it to a specific, namable change or practice in THIS sermon, not generic homiletics advice. (d) No em-dashes, sentence case, no quotation marks (the \`anchored_quote\` field carries any quoted sermon text).

Schema validation will reject responses that violate this contract. Call \`submit_sermon_evaluation\` once with the complete object.`;

const SCORING_CALIBRATION = `## SCORING CALIBRATION (TOP OF SCALE — APPLY WHEN ASSIGNING CRITERION SCORES)

**When to award 5:** Apply this per criterion: if the work is not merely strong but is among the best examples of that homiletical move you would expect to see — something a preacher could study as a model — the score is **5**. Do not reserve 5 for theoretical perfection; reserve it for genuine excellence, which real sermons do achieve. A faithful, well-crafted sermon may legitimately earn one or more 5s. A 5 means worth studying or sharing, **not** perfect or flawless. **Withholding a deserved 5 is a scoring error.** Award 5 when the evidence supports it; do not inflate the rest of the scale.

**3 vs 4 decision rule:** Apply this test per criterion: if you can point to **specific, genuine strength** in the sermon text for this criterion and your main reservation is only that it could be even better, the score is **4**, not 3. Reserve **3** for criteria that are merely adequate — present and competent but with **no notable strength**. If you find yourself scoring 3 while also describing real strength in the narrative, that is the compression error; the correct score is 4. The Rubric Reference definition of **3** is unchanged ("Adequate. Present but not striking") — this rule sharpens the line; it does not move it. Do not soften 3s on merely-adequate work or inflate every score. This section only corrects top-of-scale compression; it does not change 1, 2, band thresholds, weighting, or tone.`;

const SCORING_STRENGTH_GATE = `**REQUIRED per-criterion strength gate (procedural — run while scoring, not part of JSON):** Before you assign each criterion's \`score\`, complete this gate for that criterion alone. Work through criteria **1 through 11 in order**; do not batch-assign scores. In your reasoning only (never in the submitted JSON), answer exactly: **"Is there notable, genuine strength in the sermon text for this criterion — strength striking enough that this criterion stands out, not merely functions? — [cite the specific textual evidence that makes it striking, OR state 'no notable strength']"** Baseline competence alone (a clear outline, a workable transition, generic clarity) is **not** notable strength — that is adequate work. Then apply the rule that follows from your answer: (a) If you cited **notable** strength (this criterion **stands out** in the sermon, not merely does its job) and your only reservation is that it **could be even better**, the score is **at minimum 4** — you may not assign 3. (b) If that notable strength is **among the best examples of that homiletical move you would expect to see** (a preacher could study it as a model), the score is **5**. (c) If you stated **no notable strength** (present and competent but not striking — including work that functions without standing out), the score is **3 or below**, per the rubric definitions for 1–3. **Compression check:** If your gate answer cites **notable** strength but you were about to assign 3, stop — that contradiction is a scoring error; resolve it to **4** (or **5** if (b) applies) before you lock the score. Do not paste the gate question or answer into \`narrative\`; do not add any new JSON field for the gate. The submitted \`narrative\` is the published critique only and must match the locked score.`;

export function buildSystemPrompt(): string {
  const rubric = loadRubricMarkdown();
  return `${rubric}

---

${SCORING_CALIBRATION}

${SCORING_STRENGTH_GATE}

---

${STRUCTURAL_CONTRACT}`;
}

export type EvaluationUserMessageInput = {
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
  primaryPassage?: string;
};

export function buildUserMessage({
  sermonTitle,
  manuscript,
  context,
  primaryPassage,
}: EvaluationUserMessageInput): string {
  const contextBlock = context ? `${buildContextPreamble(context)}\n\n---\n\n` : "";
  const primaryPassageBlock = primaryPassage
    ? `**Primary passage (provided by the preacher):** ${primaryPassage}\n\n`
    : "";
  const metaInstructions = primaryPassage
    ? "Use the preacher-provided primary passage above for `meta.scripture_reference`. Infer preacher name, length (~150 wpm from word count), and `submission_mode` (`manuscript` or `transcript`) from the manuscript for `meta` when not stated explicitly."
    : "Infer preacher name, passage, length (~150 wpm from word count), and `submission_mode` (`manuscript` or `transcript`) from the manuscript for `meta` when not stated explicitly.";

  return `Evaluate this sermon manuscript.

**Working title:** ${sermonTitle}

${metaInstructions} Set \`meta.audio_available\` to \`false\` when only a manuscript is provided (no preached audio/video). Use snake_case field names from the tool schema.

---

${primaryPassageBlock}${contextBlock}## Manuscript

${manuscript}`;
}

export function getEvaluationModel(): string {
  return process.env.EVALUATION_MODEL ?? "claude-opus-4-8";
}
