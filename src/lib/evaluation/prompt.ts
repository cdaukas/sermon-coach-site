import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildContextPreamble, type SermonContext } from "./context";
import {
  SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
  type OutputLanguage,
} from "./output-language";
import { deriveBookFromPassage } from "./scripture-book";

export const EVALUATION_PROMPT_VERSION = "v3.5";

/** Rows below this prompt_version use read-grandfather verdict caps (no 60/32 on dashboard parse). */
export const VERDICT_STRICT_CAPS_FROM = "v2.3";

const rubricPath = join(process.cwd(), "src/lib/evaluation/rubric.md");
const rewriteRegisterPath = join(
  process.cwd(),
  "src/lib/evaluation/rewrite-register.md",
);

let cachedRubric: string | null = null;
let cachedRewriteRegister: string | null = null;

export function loadRubricMarkdown(): string {
  if (!cachedRubric) {
    cachedRubric = readFileSync(rubricPath, "utf8");
  }
  return cachedRubric;
}

/** Shared rewrite-register partial for scored eval and Mentor Mode. */
export function loadRewriteRegisterMarkdown(): string {
  if (!cachedRewriteRegister) {
    cachedRewriteRegister = readFileSync(rewriteRegisterPath, "utf8");
  }
  return cachedRewriteRegister;
}

const STRUCTURAL_CONTRACT = `## STRUCTURAL CONTRACT (NON-NEGOTIABLE)

0. **NO EM-DASHES IN GENERATED PROSE.** Do not use the em-dash character (U+2014) or the en-dash (U+2013) in any field you write. Recast with a comma, a period, or a semicolon. Do not substitute a hyphen or an unspaced double-hyphen. Quoted sermon text is the only exception: \`anchored_quote.text\`, \`rewrites[].original\`, and a quotation wrapping the preacher's own words inside \`narrative\` or \`rationale\`. Forbidden in: \`melodic_line_and_big_idea.book\` / \`passage\` / \`melodic_line\`, \`verdict.affirmation\`, \`verdict.improvement\`, criterion \`narrative\` outside those quotes, \`whats_working\` headlines and explanations, \`top_priorities\` headlines / principle_tag / rationale / practical_step, rewrite analysis / rewrite / moment_label, heat_map beat_label and notes. Verdict headlines (\`verdict_line\`) are produced later and must also stay dash-free.

1. Score exactly 11 criteria in a 3+3+3+2 layout across the four canonical categories (Text & Theology, Structure & Craft, Application & Audience Connection, Ecclesial & Spiritual). Use the canonical criterion names from the rubric. Each criterion object: \`id\` (1–11), \`name\` (enum), \`category\` (1–4), \`tradition_tag\`, \`score\` (1–5), \`narrative\` (2–4 sentences of diagnostic critique with at least one direct sermon quote, then the mandatory PER-CRITERION CLOSE sentence from item 7), optional \`anchored_quote\`. For criterion 1, write the scored work first (passage-fidelity critique plus the close). Then, unless \`reading_source\` is \`withheld\`, start a new paragraph of two or three sentences: observation plus question. Never embed that observation mid-paragraph or before the close. Do not submit category subtotals; the app computes them.

2. Split \`verdict\` into two JSON strings, \`affirmation\` and \`improvement\` (never one combined block). HARD LIMITS (count words before submit; over-limit responses are rejected): \`verdict.affirmation\` ≤60 words (target ~50–60; ONE named strength only; slightly elevated altitude; no quotation marks; no criterion-level detail). \`verdict.improvement\` ≤32 words (target ~25–30; headline pointer with one qualifying clause, not an explanation; no quotation marks). \`top_priorities[0]\` must match \`verdict.improvement\` in substance.

3. Category dashboards are diagnostic-first. Do not add other prescriptive growth footers in per-criterion narratives beyond the mandatory PER-CRITERION CLOSE sentence in item 7 (required for every score, including 4 and 5). Do not include \`growth_opportunities\` or any per-category growth array; that field is not in the schema. Ranked, this-week prescriptive work goes in \`top_priorities\` only (length exactly 3; each item needs \`rank\`, \`headline\`, \`principle_tag\`, \`rationale\`, \`practical_step\`).

4. Set \`meta.audio_available\` from whether audio/video of the preached sermon was supplied. When \`audio_available\` is true, populate \`heat_map\` with full beat-by-beat data (\`beats\` with \`time_range\`, \`beat_label\`, \`register\`, \`text_supports\`, \`notes\`; optional \`total_minutes\`). When false (manuscript-only), set \`heat_map\` to \`null\`: no stub object, no manuscript-inferred timeline rows. Criterion #8 still scores in the rubric; its \`narrative\` carries delivery diagnostics in prose.

5. Lock section titles: "Where It's Strong", "Where You Can Grow", "What Improvement Looks Like". No alternatives or editorial garnish. JSON field names (\`whats_working\`, \`top_priorities\`, \`rewrites\`) describe content; titles are render-layer only.

6. Return JSON matching \`submit_sermon_evaluation\` exactly. Top-level keys (all required): \`meta\`, \`scoring\`, \`verdict\`, \`categories\`, \`heat_map\`, \`whats_working\` (3–5 cards), \`top_priorities\` (exactly 3), \`rewrites\` (1–2), \`melodic_line_and_big_idea\`. \`meta\` includes \`audio_available\`. \`scoring\` includes \`composite_simple\`, \`composite_weighted\`, \`band\`, \`raw_total\`, \`raw_max\` (55); no letter grade, no \`diagnostic_gap\`. \`categories\` is four items (3+3+3+2 criteria); each has \`id\`, \`name\`, \`number\`, \`criteria\` only. \`verdict\` is \`{ affirmation, improvement }\`. \`melodic_line_and_big_idea\` is the non-scored three-line block (book, passage, melodic_line, reading_source). Do not include \`fcf\`, \`growth_opportunities_detailed\`, \`methodology_note\`, or per-category \`growth_opportunities\`.

7. **PER-CRITERION CLOSE** (append inside \`narrative\` for every criterion): End the scored portion of each criterion's narrative with ONE forward-looking sentence, scaled to its score.

- Scores 1 to 4 (climb note): Append one sentence naming what the next band up would concretely require IN THIS SERMON. Format: "To reach a [next score], [specific, sermon-anchored change]." Scale it with the score: a 1 to 2 or 2 to 3 note may name a foundational fix; a 3 to 4 note names a smaller, sharper move; a 4 to 5 note names the final increment to genuine excellence, the most refined and specific move of all, never a generic "tighten it up." A 4 is already strong, so its note must read as the last polish on good work, not as a correction. Example (3 to 4): "To reach a 4, ground the application in one concrete situation your congregation actually faces this week rather than the general call to trust." Example (4 to 5): "To reach a 5, carry the Monday-morning image from your conclusion back into the second point so the application arc is felt earlier, not only at the end."

- Score 5 (hold note): Do not invent a weakness and do not imagine a sixth band. Append one sentence naming what the preacher should keep doing to hold this strength in future sermons. Format: "To hold this, [specific, sermon-anchored practice]." Phrase it as preservation, not correction. Example: "To hold this, keep letting the text set your structure the way the three movements here grew straight out of the passage's own logic."

Rules for both notes: (a) ONE sentence, woven into the existing \`narrative\` field. Do NOT create a separate field, callout, or "Practical Step" box (that formatting belongs to Top 3 Priorities only). (b) The note POINTS tactically; it does not prescribe deeply. \`top_priorities\` remains the place for ranked, this-week prescriptive steps. If a criterion also appears in \`top_priorities\`, the note stays a one-line tactical pointer and must NOT duplicate the Priority's full prescription (different altitude). (c) Anchor it to a specific, namable change or practice in THIS sermon, not generic homiletics advice. (d) No em-dashes, sentence case, no quotation marks (the \`anchored_quote\` field carries any quoted sermon text). For criterion 1 only, the melodic-line paragraph comes AFTER this close, not before it.

8. **\`tradition_tag\` is locked.** Copy the exact string for that criterion id. Author or org, then a middle dot, then the work. Never put the criterion name in the work slot. Criterion 4 is Chapell's book, not "Fallen Condition Focus".

- 1: Simeon Trust · Expositional Preaching
- 2: Chapell · Christ-Centered Preaching
- 3: Piper · The Supremacy of God in Preaching
- 4: Chapell · Christ-Centered Preaching
- 5: Robinson · Biblical Preaching
- 6: Simeon Trust · Workshop practice
- 7: Keller · Preaching
- 8: Piper · Expository Exultation
- 9: Keller · Preaching
- 10: 9Marks · Preach
- 11: Piper · Expository Exultation

Schema validation will reject responses that violate this contract. Call \`submit_sermon_evaluation\` once with the complete object.`;

const SCORING_CALIBRATION = `## SCORING CALIBRATION (TOP OF SCALE — APPLY WHEN ASSIGNING CRITERION SCORES)

**When to award 5:** Apply this per criterion: if the work is not merely strong but is among the best examples of that homiletical move you would expect to see — something a preacher could study as a model — the score is **5**. Do not reserve 5 for theoretical perfection; reserve it for genuine excellence, which real sermons do achieve. A faithful, well-crafted sermon may legitimately earn one or more 5s. A 5 means worth studying or sharing, **not** perfect or flawless. **Withholding a deserved 5 is a scoring error.** Award 5 when the evidence supports it; do not inflate the rest of the scale.

**3 vs 4 decision rule:** Apply this test per criterion: if you can point to **specific, genuine strength** in the sermon text for this criterion and your main reservation is only that it could be even better, the score is **4**, not 3. Reserve **3** for criteria that are merely adequate — present and competent but with **no notable strength**. If you find yourself scoring 3 while also describing real strength in the narrative, that is the compression error; the correct score is 4. The Rubric Reference definition of **3** is unchanged ("Adequate. Present but not striking") — this rule sharpens the line; it does not move it. Do not soften 3s on merely-adequate work or inflate every score. This section only corrects top-of-scale compression; it does not change 1, 2, band thresholds, weighting, or tone.`;

const SCORING_STRENGTH_GATE = `**REQUIRED per-criterion strength gate (procedural — run while scoring, not part of JSON):** Before you assign each criterion's \`score\`, complete this gate for that criterion alone. Work through criteria **1 through 11 in order**; do not batch-assign scores. In your reasoning only (never in the submitted JSON), answer exactly: **"Is there notable, genuine strength in the sermon text for this criterion — strength striking enough that this criterion stands out, not merely functions? — [cite the specific textual evidence that makes it striking, OR state 'no notable strength']"** Baseline competence alone (a clear outline, a workable transition, generic clarity) is **not** notable strength — that is adequate work. Then apply the rule that follows from your answer: (a) If you cited **notable** strength (this criterion **stands out** in the sermon, not merely does its job) and your only reservation is that it **could be even better**, the score is **at minimum 4** — you may not assign 3. (b) If that notable strength is **among the best examples of that homiletical move you would expect to see** (a preacher could study it as a model), the score is **5**. (c) If you stated **no notable strength** (present and competent but not striking — including work that functions without standing out), the score is **3 or below**, per the rubric definitions for 1–3. **Compression check:** If your gate answer cites **notable** strength but you were about to assign 3, stop — that contradiction is a scoring error; resolve it to **4** (or **5** if (b) applies) before you lock the score. Do not paste the gate question or answer into \`narrative\`; do not add any new JSON field for the gate. The submitted \`narrative\` is the published critique only and must match the locked score.`;

const MELODIC_LINE_CONTRACT = `## MELODIC LINE AND BIG IDEA (DESCRIPTIVE — NOT SCORED)

Simeon Trust's **melodic line** is the theme that holds an **entire book** together. It is a context discipline. It is not a scored sub-question, not a cap, and not a band. It must not raise or lower criterion 1 or any other criterion.

Haddon Robinson's **big idea** is the single dominant idea **this passage** yields. It is scored under criterion 5. Do not call the passage's big idea a melodic line.

Three levels, kept distinct:
- Whole book → melodic line (named in the display block and in criterion 1's narrative; not scored)
- This passage → big idea / theme of the passage (criterion 5)
- Whole Bible → Christ-centered / redemptive arc (criterion 2)

**Criterion 1 scores passage fidelity only.** Does the sermon say what the text says? Genre, context, grammar, intended sense of the passage. Wrestling with the hard parts of the text is scored under 6. The book's tune is not part of the 1–5.

**Name the reading before you comment on it.** Every other criterion may assert. The melodic-line observation states its premise first. That is workshop conversation, not a machine grading a contested exegetical position.

**Criterion 1 narrative. Two paragraphs.** First paragraph: passage-fidelity critique, then the per-criterion close ("To reach a 5, ..." or "To hold this, ..."). Second paragraph: two or three sentences, observation plus question, never a verdict. Put a paragraph break between them. Do not embed the observation mid-paragraph or before the close. Show this book's line; do not define "melodic line." Naming the line concretely teaches the concept. Definitions belong in How It's Scored, not in per-evaluation prose. Do not use in-tune / out-of-tune / partly-in-tune language. Do not let this observation change the score. No em-dashes.

1. Name the melody this read is working from, as this book actually sings it.
2. Name where this sermon sits relative to it, as observation.
3. Ask whether any difference was deliberate. Give the preacher a dignified answer either way.

Model (second paragraph only; the close already happened above it):
"Philippians keeps returning to partnership in the gospel that holds under pressure, with Christ as both the pattern and the prize. Your sermon on 4:10-13 reads the passage as a lesson in learned contentment and does not lean on that larger argument. Was that a choice, this week standing on its own, or did the book recede without you meaning it to?"

The per-criterion close belongs to the scored work (passage fidelity), not to this observation. The observation is the last thing in criterion 1's narrative.

**What is worth noticing when it is present (observation only — never a scoring trigger):**
1. Wrong book's tune. James read through Romans. Proverbs preached on a Pauline indicative-then-imperative frame. Ecclesiastes resolved by Philippians.
2. Series theme substituted for the book's argument. In conversation with "Living Sent, week 4" and apart from Acts.
3. Melodic line flattened to a moral. Jonah as obey God. Judges as leadership lessons. Nehemiah as how to build.
4. The canon shortcut. Jumping from the passage to Christ without passing through the book's own argument. The destination is right and the route is not.
5. Melodic line applied so hard the passage disappears. Every sermon in the series lands on the same sentence.
6. Announced but not governing. The preacher states the line in the introduction, then preaches a sermon the statement had no effect on.

**Guardrails:**
- Contested books (Ecclesiastes, Song of Songs, Revelation, James, 1 Samuel, Judges): name the reading the sermon appears to hold, or the preacher's own line if given. Do not grade the sermon against a house view.
- Poetry and wisdom: a single psalm sits in the Psalter, which has shape rather than a single argument. Use the Psalter's shape and the psalm's genre. Do not invent a line. Same for individual proverbs, where the frame is chapters 1–9 and the fear of the Lord.
- Occasional sermons (funerals, weddings, topical sermons still sitting on a text in a book): the observation still belongs, but a funeral homily on Psalm 23 is not failing when it does not preach the shape of Book I. Ask; do not scold.
- Never invent a melodic line to have something to say. If you cannot state the book's argument in a sentence you would defend, say so, set \`reading_source\` to \`withheld\`, and skip the observation. Silence beats a confident sentence about 1 Samuel.

**\`melodic_line_and_big_idea\` (required JSON object, not scored, no verdict):**
- \`book\`: the book, named. Short. "Philippians." Not an argument and not a score.
- \`passage\`: one sentence. The theme / big idea of *this passage*.
- \`melodic_line\`: one sentence. The unifying theme of the book as this report reads it. If the preacher named a working line, that line is the premise; restate it, do not replace it. If withheld, say that this read will not invent one.
- \`reading_source\`: \`preacher\` when working from a line the preacher named; \`derived\` when this read supplies the book's argument; \`withheld\` when you will not invent one.
No \`fit\`. No in-tune / out-of-tune label. The JSON block is descriptive. No em-dashes in any of these strings. The observation-and-question lives in criterion 1's closing paragraph, after the close sentence.`;

export function buildSystemPrompt(): string {
  const rubric = loadRubricMarkdown();
  const rewriteRegister = loadRewriteRegisterMarkdown();
  return `${rubric}

---

${rewriteRegister}

---

${SCORING_CALIBRATION}

${SCORING_STRENGTH_GATE}

---

${MELODIC_LINE_CONTRACT}

---

${STRUCTURAL_CONTRACT}`;
}

export type EvaluationUserMessageInput = {
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
  primaryPassage?: string;
  outputLanguage?: OutputLanguage;
};

export function buildUserMessage({
  sermonTitle,
  manuscript,
  context,
  primaryPassage,
  outputLanguage = "en",
}: EvaluationUserMessageInput): string {
  const contextBlock = context ? `${buildContextPreamble(context)}\n\n---\n\n` : "";
  const derivedBook = deriveBookFromPassage(primaryPassage);
  const primaryPassageBlock = primaryPassage
    ? `**Primary passage (provided by the preacher):** ${primaryPassage}\n\n`
    : "";
  const derivedBookBlock = derivedBook
    ? `**Derived book (from the primary passage, not from any series title):** ${derivedBook}\nUse this book for Simeon Trust's melodic line (the descriptive block and criterion 1's narrative observation). It does not affect criterion 1's score. A series title is not a substitute for the book's argument.\n\n`
    : primaryPassage
      ? "**Derived book:** could not be parsed from the primary passage. Derive the book from the manuscript's Scripture reference if it is unambiguous. If it is not, do not invent a book.\n\n"
      : "";
  const metaInstructions = primaryPassage
    ? "Use the preacher-provided primary passage above for `meta.scripture_reference`. Infer preacher name, length (~150 wpm from word count), and `submission_mode` (`manuscript` or `transcript`) from the manuscript for `meta` when not stated explicitly."
    : "Infer preacher name, passage, length (~150 wpm from word count), and `submission_mode` (`manuscript` or `transcript`) from the manuscript for `meta` when not stated explicitly.";
  const languageBlock =
    outputLanguage === "es"
      ? `${SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS}\n\n---\n\n`
      : "";

  return `Evaluate this sermon manuscript.

**Working title:** ${sermonTitle}

${metaInstructions} Set \`meta.audio_available\` to \`false\` when only a manuscript is provided (no preached audio/video). Use snake_case field names from the tool schema.

---

${languageBlock}${primaryPassageBlock}${derivedBookBlock}${contextBlock}## Manuscript

${manuscript}`;
}

export function getEvaluationModel(): string {
  return process.env.EVALUATION_MODEL ?? "claude-opus-4-8";
}
