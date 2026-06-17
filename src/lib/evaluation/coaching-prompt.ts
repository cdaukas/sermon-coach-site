import type { SermonContext } from "./context";
import type { GrowthEdgeSelection } from "./growth-edge";
import { flattenCriteria, selectGrowthCriterion } from "./growth-edge";
import { extractManuscriptExcerpt } from "./manuscript-excerpt";
import type { EvaluationResultStrict } from "./schema";

export const COACHING_INSTRUCTION_PROMPT = `You are writing a coaching report for a preacher, in the voice of a warm, experienced mentor who has read this exact sermon closely. The scores are already computed and fixed. You are not scoring. You are rendering the same honest assessment in an encouraging, forward-leaning register for a preacher who may be early in their development.

Below the line you will receive a completed diagnostic evaluation of one sermon: its per-criterion scores and narratives, its anchored quotes, and the original sermon excerpts around the weakest moment.

Produce exactly three blocks. Honesty is non-negotiable. Never inflate, never invent a strength the evaluation does not support, never soften the growth edge into vagueness. Warmth is in the framing, not in flattery.

BLOCK 1 — "Lead With This"
Choose the genuinely strongest things in this sermon, drawn from the highest-scoring criteria and the existing anchored quotes. Give three when three are real. Give two when only two are genuinely strong. Never manufacture a third strength to hit a count. For each strength: name it in plain second person ("You name the voice before you answer it"), then quote the preacher's own words as evidence, then one sentence on why it works.

BLOCK 2 — "How To Grow"
Take the single highest-leverage growth area in the evaluation (the lowest-scoring criterion, or the one the verdict names as the top improvement). Write one paragraph. Name the one thing to work on, ground it in the specific moment in the sermon where it shows, and give one concrete thing to try this week. Frame it as a direction to walk, not a failure to fix. Do not list other weaknesses. One edge only, even if the evaluation found several. Preach it as an invitation.

BLOCK 3 — "What It Looks Like"
Show the difference concretely. Quote the original moment from the sermon (the "before"), then write an improved version (the "after") that applies the Block 2 guidance, in this preacher's own register and voice, not a generic ideal. Close with one short line naming what changed. Always produce both halves.

CONSTRAINTS
- No score, number, band, or tier appears anywhere in the prose.
- Second person throughout ("you," "your"). Warm, direct, pastoral.
- No em-dashes. No exclamation points. Sentence-case.
- No AI-tell phrases. Concrete nouns, active verbs.
- Quote the preacher accurately. Never fabricate words they did not write.
- Match the visual style and reading level of the standard report: plain, literate, unfussy.

Return only the JSON object matching the provided schema, no preamble.`;

export type CoachingPromptInput = {
  result: EvaluationResultStrict;
  manuscript: string;
  sermonTitle: string;
  primaryPassage?: string | null;
  context?: SermonContext;
};

function formatContextBlock(context?: SermonContext): string {
  if (!context) {
    return "";
  }

  const lines: string[] = ["CONTEXT:"];
  if (context.occasion) {
    lines.push(`Occasion: ${context.occasion}`);
  }
  if (context.audience) {
    lines.push(`Audience: ${context.audience}`);
  }
  if (context.series) {
    lines.push(`Series: ${context.series}`);
  }
  if (context.other) {
    lines.push(`Other: ${context.other}`);
  }

  return lines.length > 1 ? `${lines.join("\n")}\n\n` : "";
}

function formatAnchoredQuotes(result: EvaluationResultStrict): string {
  const lines: string[] = [];

  for (const criterion of flattenCriteria(result)) {
    const quote = criterion.anchored_quote?.text?.trim();
    if (!quote) {
      continue;
    }

    lines.push(
      `- ${criterion.name}: "${quote}" (${criterion.anchored_quote?.approximate_location ?? "location not specified"})`,
    );
  }

  return lines.join("\n");
}

function formatCategoryBlocks(result: EvaluationResultStrict): string {
  const blocks: string[] = [];

  for (const category of result.categories) {
    blocks.push(`CATEGORY ${category.number} — ${category.name.toUpperCase()}\n`);

    for (const criterion of category.criteria) {
      blocks.push(
        `Criterion: ${criterion.name} — ${criterion.score}/5`,
        criterion.narrative,
        "",
      );
    }
  }

  return blocks.join("\n").trimEnd();
}

function formatGrowthEdgeBlock(
  growth: GrowthEdgeSelection,
  manuscriptExcerpt: string | null,
): string {
  const { criterion, priority } = growth;
  const excerpt =
    manuscriptExcerpt ??
    "(No matching manuscript excerpt found; use the criterion narrative and anchored quote only.)";

  return [
    `HIGHEST-LEVERAGE GROWTH EDGE (pre-selected): ${criterion.name} (${criterion.score}/5) — ${priority.headline}`,
    `Diagnostic note: ${priority.rationale}`,
    `Practical step already drafted: ${priority.practical_step}`,
    "",
    "ORIGINAL SERMON EXCERPT AROUND THE GROWTH MOMENT (for the rewrite):",
    excerpt,
  ].join("\n");
}

export function buildCoachingUserMessage({
  result,
  manuscript,
  sermonTitle,
  primaryPassage,
  context,
}: CoachingPromptInput): string {
  const growth = selectGrowthCriterion(result);
  const growthQuote =
    growth.criterion.anchored_quote?.text?.trim() ??
    result.rewrites[0]?.original ??
    "";
  const manuscriptExcerpt = extractManuscriptExcerpt(manuscript, growthQuote);

  const passage =
    primaryPassage?.trim() ||
    result.meta.scripture_reference ||
    "Not specified";

  return `${COACHING_INSTRUCTION_PROMPT}

--- EVALUATION DATA BELOW ---

SERMON: ${sermonTitle}
PASSAGE: ${passage}
MODE: ${result.meta.submission_mode}
BAND: ${result.scoring.band}

${formatContextBlock(context)}VERDICT — AFFIRMATION:
${result.verdict.affirmation}

VERDICT — TOP IMPROVEMENT:
${result.verdict.improvement}

${formatCategoryBlocks(result)}

ANCHORED QUOTES (evidence already extracted):
${formatAnchoredQuotes(result)}

${formatGrowthEdgeBlock(growth, manuscriptExcerpt)}`;
}
