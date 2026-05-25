import { readFileSync } from "node:fs";
import { join } from "node:path";

export const EVALUATION_PROMPT_VERSION = "v2";

const rubricPath = join(process.cwd(), "src/lib/evaluation/rubric.md");

let cachedRubric: string | null = null;

export function loadRubricMarkdown(): string {
  if (!cachedRubric) {
    cachedRubric = readFileSync(rubricPath, "utf8");
  }
  return cachedRubric;
}

const STRUCTURAL_CONTRACT = `## STRUCTURAL CONTRACT (NON-NEGOTIABLE)

1. Score exactly 11 criteria in a 3+3+3+2 layout across the four canonical categories (Text & Theology, Structure & Craft, Application & Audience Connection, Ecclesial & Spiritual). Use the canonical criterion names from the rubric.

2. Split \`verdict\` into \`affirmation_paragraph\` (~50–60 words, ONE named strength, no direct sermon quotes) and \`improvement_sentence\` (~15–20 words, one short sentence — headline pointer, not explanation). \`top_priorities[0]\` must match \`improvement_sentence\` in substance.

3. Category dashboards are diagnostic only. Do not put prescriptive growth footers in per-criterion narratives. Leave each \`categories[].growth_opportunities\` empty (\`[]\`). All prescriptive work goes in \`top_priorities\` (length exactly 3) and \`growth_opportunities_detailed\` (length exactly 3).

4. If audio of the preached sermon was provided, populate \`heat_map\` with \`audio_processed: true\` and full beat-by-beat data. On manuscript-only (no audio), return the required \`heat_map\` stub: \`audio_processed: false\`, a \`warning_note\` that delivery was not assessed, \`total_minutes\` from the estimate, and \`beats\` satisfying the tool schema minimum — do not add manuscript-inferred timeline rows.

5. Lock section titles: "Lead with these", "Where You Can Grow", "What Improvement Looks Like". No alternatives or editorial garnish.

6. Return JSON matching \`submit_sermon_evaluation\` exactly: required fields \`meta\`, \`scoring\`, \`verdict\`, \`categories\` (four items, each with \`criteria\` and \`growth_opportunities\`), \`heat_map\`, \`whats_working\` (3–5 cards), \`growth_opportunities_detailed\` (exactly 3), \`top_priorities\` (exactly 3), \`rewrites\` (1–2), \`fcf\`, \`methodology_note\`. \`verdict\` is an object with separate \`affirmation_paragraph\` and \`improvement_sentence\` strings, not one concatenated verdict.

Schema validation will reject responses that violate this contract. Call \`submit_sermon_evaluation\` once with the complete object.`;

export function buildSystemPrompt(): string {
  const rubric = loadRubricMarkdown();
  return `${rubric}

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

Infer preacher name, passage, length (~150 wpm from word count), and \`submission_mode\` from the manuscript for \`meta\` when not stated explicitly. Use snake_case field names from the tool schema.

---

## Manuscript

${manuscript}`;
}

export function getEvaluationModel(): string {
  return process.env.EVALUATION_MODEL ?? "claude-sonnet-4-6";
}
