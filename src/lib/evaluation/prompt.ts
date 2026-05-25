import { readFileSync } from "node:fs";
import { join } from "node:path";

export const EVALUATION_PROMPT_VERSION = "v1";

const rubricPath = join(process.cwd(), "src/lib/evaluation/rubric.md");

let cachedRubric: string | null = null;

export function loadRubricMarkdown(): string {
  if (!cachedRubric) {
    cachedRubric = readFileSync(rubricPath, "utf8");
  }
  return cachedRubric;
}

export function buildSystemPrompt(): string {
  const rubric = loadRubricMarkdown();
  return `${rubric}

---

**Output:** Call \`submit_sermon_evaluation\` once with the complete evaluation object. Do not omit sections.`;
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

Infer preacher name, passage, length, and preaching mode from the manuscript for \`meta\` when not stated explicitly.

---

## Manuscript

${manuscript}`;
}

export function getEvaluationModel(): string {
  return process.env.EVALUATION_MODEL ?? "claude-sonnet-4-6";
}
