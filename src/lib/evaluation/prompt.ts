import { readFileSync } from "node:fs";
import { join } from "node:path";

export const EVALUATION_PROMPT_VERSION = "v2.8";

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

1. Score exactly 11 criteria in a 3+3+3+2 layout across the four canonical categories (Text & Theology, Structure & Craft, Application & Audience Connection, Ecclesial & Spiritual). Use the canonical criterion names from the rubric. Each criterion object: \`id\` (1–11), \`name\` (enum), \`category\` (1–4), \`tradition_tag\`, \`score\` (1–5), \`narrative\` (2–4 sentences with at least one direct sermon quote), optional \`anchored_quote\`. Do not submit category subtotals — the app computes them.

2. Split \`verdict\` into two JSON strings — \`affirmation\` and \`improvement\` (never one combined block). HARD LIMITS (count words before submit; over-limit responses are rejected): \`verdict.affirmation\` ≤60 words (target ~50–60; ONE named strength only; slightly elevated altitude; no quotation marks; no criterion-level detail). \`verdict.improvement\` ≤32 words (target ~25–30; headline pointer with one qualifying clause — not an explanation; no quotation marks). \`top_priorities[0]\` must match \`verdict.improvement\` in substance.

3. Category dashboards are diagnostic only. Do not put prescriptive growth footers in per-criterion narratives. Do not include \`growth_opportunities\` or any per-category growth array — that field is not in the schema. All prescriptive work goes in \`top_priorities\` only (length exactly 3; each item needs \`rank\`, \`headline\`, \`principle_tag\`, \`rationale\`, \`practical_step\`).

4. Set \`meta.audio_available\` from whether audio/video of the preached sermon was supplied. When \`audio_available\` is true, populate \`heat_map\` with full beat-by-beat data (\`beats\` with \`time_range\`, \`beat_label\`, \`register\`, \`text_supports\`, \`notes\`; optional \`total_minutes\`). When false (manuscript-only), set \`heat_map\` to \`null\` — no stub object, no manuscript-inferred timeline rows. Criterion #8 still scores in the rubric; its \`narrative\` carries delivery diagnostics in prose.

5. Lock section titles: "Lead with these", "Where You Can Grow", "What Improvement Looks Like". No alternatives or editorial garnish. JSON field names (\`whats_working\`, \`top_priorities\`, \`rewrites\`) describe content; titles are render-layer only.

6. Return JSON matching \`submit_sermon_evaluation\` exactly. Top-level keys (all required): \`meta\`, \`scoring\`, \`verdict\`, \`categories\`, \`heat_map\`, \`whats_working\` (3–5 cards), \`top_priorities\` (exactly 3), \`rewrites\` (1–2). \`meta\` includes \`audio_available\`. \`scoring\` includes \`composite_simple\`, \`composite_weighted\`, \`band\`, \`raw_total\`, \`raw_max\` (55) — no letter grade, no \`diagnostic_gap\`. \`categories\` is four items (3+3+3+2 criteria); each has \`id\`, \`name\`, \`number\`, \`criteria\` only. \`verdict\` is \`{ affirmation, improvement }\`. Do not include \`fcf\`, \`growth_opportunities_detailed\`, \`methodology_note\`, or per-category \`growth_opportunities\`.

7. **PER-CRITERION CLIMB NOTE** (append inside \`narrative\` for low-scoring criteria only): For any criterion scoring 1–3, append ONE sentence to the end of its \`narrative\` that names what the next band up would concretely require IN THIS SERMON. Format: "To reach a [next score], [specific, sermon-anchored change]." Rules: (a) ONLY for criteria scoring 1–3 — criteria scoring 4 or 5 get NO climb note; their \`narrative\` stays purely diagnostic. (b) ONE sentence, woven into the existing \`narrative\` field — do NOT create a separate field, callout, or "Practical Step" box (that formatting belongs to Top 3 Priorities only). (c) The climb note POINTS tactically; it does not prescribe deeply — \`top_priorities\` remains the place for ranked, this-week prescriptive steps. If a criterion also appears in \`top_priorities\`, the climb note stays a one-line tactical pointer and must NOT duplicate the Priority's full prescription (different altitude, same as the verdict-vs-Priority#1 split). (d) Anchor it to a specific, namable change in THIS sermon — not generic homiletics advice (e.g. "To reach a 4, ground the application in one concrete situation your congregation actually faces this week" beats "improve your application"). (e) Scale with the score: a 3→4 note names a smaller, sharper move; a 1→2 or 2→3 note may name a more foundational fix.

Schema validation will reject responses that violate this contract. Call \`submit_sermon_evaluation\` once with the complete object.`;

const SCORING_CALIBRATION = `## SCORING CALIBRATION (TOP OF SCALE — APPLY WHEN ASSIGNING CRITERION SCORES)

**Permission to award 5:** A **5** is the correct and expected score when a criterion is genuinely excellent in this sermon — exemplary execution a preacher could study as a model for that homiletical move. A 5 means worth studying or sharing, **not** perfect or flawless. **Withholding a deserved 5 is a scoring error**, not prudent caution. Do not treat 5 as reserved or nearly unreachable; when the evidence in this sermon supports it, assign 5. Multiple criteria in one faithful sermon may earn 5s without inflating the rest of the scale.

**4 vs 3 boundary:** A **4** is the right score when the criterion is **clearly strong** with only minor room to grow — real strength in this sermon, not near-perfection or an unforgettable tour de force. Do not require flawless execution to award a 4. **Do not default to 3 when the work is plainly strong.** Keep the Rubric Reference definition of **3** unchanged ("Adequate. Present but not striking") — that anchor is calibrated; do not soften 3s or inflate every score. This section only unlocks the top of the scale where the model has been range-compressing 4s and 5s; it does not change 1, 2, band thresholds, weighting, or tone.`;

export function buildSystemPrompt(): string {
  const rubric = loadRubricMarkdown();
  return `${rubric}

---

${SCORING_CALIBRATION}

---

${STRUCTURAL_CONTRACT}`;
}

export type EvaluationUserMessageInput = {
  sermonTitle: string;
  manuscript: string;
};

export function buildUserMessage({
  sermonTitle,
  manuscript,
}: EvaluationUserMessageInput): string {
  return `Evaluate this sermon manuscript.

**Working title:** ${sermonTitle}

Infer preacher name, passage, length (~150 wpm from word count), and \`submission_mode\` (\`manuscript\` or \`transcript\`) from the manuscript for \`meta\` when not stated explicitly. Set \`meta.audio_available\` to \`false\` when only a manuscript is provided (no preached audio/video). Use snake_case field names from the tool schema.

---

## Manuscript

${manuscript}`;
}

export function getEvaluationModel(): string {
  return process.env.EVALUATION_MODEL ?? "claude-sonnet-4-6";
}
