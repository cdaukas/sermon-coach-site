import { buildContextPreamble, type SermonContext } from "./context";
import { HIP_MOVEMENT_NAMES } from "./hip-schema";

export const HIP_REGISTER_BLOCK = `How It Preaches is a craft read, not a second score. The scored rubric already named what is broken against the criteria. This section does the thing the rubric cannot: it reads the sermon as moving rhetoric — how it opens, carries its idea, and lands.

The register is charitable but plain-spoken. Charitable does not mean gentle. Open each movement with what works before naming what does not, and never invent a flaw to fill a movement. Plain-spoken means when there is a real weakness, state it as a claim, not a suggestion.

DO: open every movement with what is actually working, named specifically; state weaknesses as actionable claims ("you are carrying two big ideas," "write it down," "trim the scaffolding"); anchor every observation to THIS sermon by quoting the manuscript or naming the specific beat; when a movement is genuinely clean, name a real cost or tradeoff rather than manufacturing a flaw; write in second person to the preacher in serif body voice; keep each movement two to four sentences.

DO NOT: soften a real weakness into a hedge ("worth deciding whether..." is too soft — say "pick the second and let the first retire"); invent a flaw because a movement feels too positive; give generic homiletics advice that could fit any sermon; restate the rubric's scored findings; use exclamation points or breathless praise.

POSTURE TEST: a movement passes if a thoughtful preacher would say "that is specifically about my sermon, and it told me something true I can use on Saturday." If it reads like general preaching advice or like it is reaching for a problem to fill space, rewrite it.`;

export type HowItPreachesPromptInput = {
  sermonTitle: string;
  manuscript: string;
  context?: SermonContext;
  primaryPassage?: string | null;
};

export function buildHowItPreachesUserMessage({
  sermonTitle,
  manuscript,
  context,
  primaryPassage,
}: HowItPreachesPromptInput): string {
  const contextBlock = context ? `${buildContextPreamble(context)}\n\n---\n\n` : "";
  const primaryPassageBlock = primaryPassage
    ? `**Primary passage:** ${primaryPassage}\n\n`
    : "";
  const movementList = HIP_MOVEMENT_NAMES.map((name, i) => `${i + 1}. ${name}`).join(
    "\n",
  );

  return `Write a How It Preaches craft read for this sermon manuscript.

**Working title:** ${sermonTitle}

${primaryPassageBlock}${contextBlock}## Register

${HIP_REGISTER_BLOCK}

## Output

Return exactly five movements in this fixed order:

${movementList}

Each movement \`body\` is two to four sentences of prose for the preacher. Wrap any quoted sermon text in \`<span class="q">...</span>\`. Do not score, do not restate rubric findings, do not use exclamation points.

---

## Manuscript

${manuscript}`;
}
