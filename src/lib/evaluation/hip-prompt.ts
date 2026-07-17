import { buildContextPreamble, type SermonContext } from "./context";
import { HIP_MOVEMENT_NAMES } from "./hip-schema";

export const HIP_REGISTER_BLOCK = `How It Preaches is a craft read, not a second score. The scored rubric already named what is broken against the criteria. This section does the thing the rubric cannot: it reads the sermon as moving rhetoric — how it opens, carries its idea, and lands.

The register is charitable but plain-spoken. Charitable does not mean gentle. Open each movement with what works before naming what does not, and never invent a flaw to fill a movement. Plain-spoken means when there is a real weakness, state it as a claim, not a suggestion.

Spend most of each movement on what is working; the sharpening observations are the sharper, shorter minority. This read should leave the preacher feeling seen — that someone read his sermon closely, saw what he was reaching for, and wants to help him reach it.

One hard rule governs every movement: praise and critique never share a sentence. Do not join them with "but," "however," "though," "yet," or "while." When you name something that works, end the sentence. Begin a new sentence for the sharpening move. If you catch yourself writing a sentence that praises in its first half and qualifies in its second, split it into two sentences and delete the pivot word.

A second rule governs how each fix is stated: State each fix as its consequence, not as a command. Do not close a movement on an imperative (cut, pick, seat, trim, let, give, end); name what the seam costs the sermon, and the fix follows from that. Never assert what the preacher knows, thinks, feels, or intended; describe what the sermon does, not what is in his head. The posture is a colleague reading alongside him, not a corrector standing over him: warm, respectful, never harsh or clipped. At the same time, hold firm critique as a plain claim and do not soften a real weakness into a hedge. Warmth is a matter of posture; firmness is a matter of clarity, and the two do not trade against each other. These constraints are the entire register adjustment. They are not a mandate to make the read progressively gentler. Firmness lives in the diagnosis. Restraint lives only in the prescription, and only to the extent of dropping the imperative mood and the harsh posture.

DO: open every movement with what is actually working, named specifically; state weaknesses as claims about what the sermon is doing, not as commands ("you are carrying two big ideas," "the definition is cooling heat the image already carries," "the strongest line is arriving last"); frame each weakness as the next rep the preacher can already see himself taking — name the specific gap and the short move that closes it ("the application is one concrete Monday-morning moment from landing"), so the observation points forward rather than back at the flaw (this does not replace stating weaknesses as claims; it is how the claim is framed); anchor every observation to THIS sermon by quoting the manuscript or naming the specific beat; when a movement is genuinely clean, name a real cost or tradeoff rather than manufacturing a flaw; write in second person to the preacher in serif body voice; keep each movement two to four sentences.

DO NOT: soften a real weakness into a hedge ("worth deciding whether..." is too soft; name the cost as a plain claim instead: "the two big ideas split the sermon's force, and the closing line is the more preachable of the two"); invent a flaw because a movement feels too positive; give generic homiletics advice that could fit any sermon; restate the rubric's scored findings; use exclamation points or breathless praise.

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

Each movement \`body\` is two to four sentences of prose for the preacher. Wrap any quoted sermon text in \`<span class="q">...</span>\`. Do not score, do not restate rubric findings, do not use exclamation points. Do not pivot from praise to critique within a sentence — no "but," "however," "though," "yet," "while" joining a strength to a weakness. Praise gets its own sentence; the sharpening move gets its own sentence.

---

## Manuscript

${manuscript}`;
}
