/**
 * Fixed prep-card copy. Selected by rank; the model writes nothing.
 * Source: claude/prep-card-copy-library.md (Downloads / Claude project).
 */

import type { PrepMeasureId } from "./measures";

export type PrepMeasureCopy = {
  id: PrepMeasureId;
  /** Strength column headline */
  strengthHeadline: string;
  strengthLine: string;
  /** Focus column — null for strengths-only measures */
  focusHeadline: string | null;
  focusLine: string | null;
  ask: string | null;
};

export const PREP_MEASURE_COPY: Record<PrepMeasureId, PrepMeasureCopy> = {
  1: {
    id: 1,
    strengthHeadline: "You let the text argue with you.",
    strengthLine:
      "Your sermons show a willingness to let the passage challenge what you came to say, rather than using it to support what you already wanted.",
    focusHeadline: "Let the text surprise you.",
    focusLine:
      "We can easily find in a passage what we came looking for. The goal is not to find your point in the passage, but to let the passage shape your point.",
    ask: "What did this text make me see that I would not have seen on my own?",
  },
  2: {
    id: 2,
    strengthHeadline: "You ask for visible obedience.",
    strengthLine:
      "Your applications move past general encouragement and give people something concrete they can actually do.",
    focusHeadline: "Make obedience visible.",
    focusLine:
      'When you call people to respond, ask whether someone could recognize the obedience in their life. "Trust God more" is true. What would that look like this week?',
    ask: "What exactly am I asking people to do?",
  },
  3: {
    id: 3,
    strengthHeadline: "You name the cost.",
    strengthLine:
      "You do not shy away from the fact that following Christ requires something. Your applications make the weight of obedience clear.",
    focusHeadline: "Name what obedience will cost.",
    focusLine:
      "If our applications never require anything, they rarely require a decision. Help people see what faithfulness will cost before you ask them to respond.",
    ask: "What will obedience to this text cost them?",
  },
  4: {
    id: 4,
    strengthHeadline: "Your endings are written, not outlined.",
    strengthLine:
      "Your conclusions bring the sermon somewhere rather than signaling that it is over.",
    focusHeadline: "Give your conclusion the attention you give your introduction.",
    focusLine:
      "Your openings are carefully crafted. Your endings are where you run out of Saturday. Decide before you write where you want to leave people.",
    ask: "Where do I want to leave them, and have I written it?",
  },
  5: {
    id: 5,
    strengthHeadline: "Your main points come from the passage.",
    strengthLine:
      "The structure of your sermons reflects the structure and emphasis of the text.",
    focusHeadline: "Check every point against the passage.",
    focusLine:
      "Write your point heads in a column. The one that breaks the pattern of the others is usually the one you brought rather than found. This matters most with points that are true but are not this passage's emphasis.",
    ask: "Did this point come from the text, or did I bring it to the text?",
  },
  6: {
    id: 6,
    strengthHeadline: "Jesus does something in your outline.",
    strengthLine:
      "Christ is not only mentioned through the sermon. He is doing something in its main movement.",
    focusHeadline: "Put Christ in the skeleton, not just the paragraphs.",
    focusLine:
      "It is possible to mention Jesus throughout a sermon without letting Christ shape where it goes.",
    ask: "What is Christ doing in this text, and where does that belong in my outline?",
  },
  7: {
    id: 7,
    strengthHeadline: "Your applications move people toward one another.",
    strengthLine:
      "You recognize that obedience is not private. You call people to respond in ways that involve others.",
    focusHeadline: "Do not send people home to obey alone.",
    focusLine:
      "Ask whether everything you asked for could be done by a person alone. Confession, forgiveness, encouragement, service, reconciliation: the most important ones need somebody else in the room.",
    ask: "Could my application be obeyed entirely by myself?",
  },
  8: {
    id: 8,
    strengthHeadline: "You always reach the gospel",
    strengthLine:
      "You do not leave the text stranded in its original setting. You show why this passage matters because of what God has done in Christ.",
    focusHeadline: null,
    focusLine: null,
    ask: null,
  },
  9: {
    id: 9,
    strengthHeadline: "You name sin without shaming people",
    strengthLine:
      "You are willing to identify what is wrong without making the people in the room the object of your criticism.",
    focusHeadline: null,
    focusLine: null,
    ask: null,
  },
  10: {
    id: 10,
    strengthHeadline: "You bring the condition into the room",
    strengthLine:
      "You help people see how the problem in the passage shows up in their own lives, rather than leaving it with the biblical characters.",
    focusHeadline: null,
    focusLine: null,
    ask: null,
  },
  11: {
    id: 11,
    strengthHeadline: "Your delight has an object",
    strengthLine:
      "When you enjoy the text, people can tell what you are enjoying. Your affection is not generic; it points at something specific.",
    focusHeadline: null,
    focusLine: null,
    ask: null,
  },
  12: {
    id: 12,
    strengthHeadline: "You remember the person who does not yet believe",
    strengthLine:
      "Your preaching leaves room for the unbeliever. You address him rather than assuming everyone listening already believes.",
    focusHeadline: null,
    focusLine: null,
    ask: null,
  },
};

export const PREP_CARD_REVERENCE = {
  label: "Before you preach anything hard",
  body: "On any text of judgment, wrath, or suffering: would this joke or clever aside survive if the grieving person in row three were the only listener?",
  cut: "If not, cut it.",
} as const;

export const PREP_CARD_STANDING_STRENGTH =
  "Self-aimed humor is a strength, not a lapse. Keep it.";

/** Short labels for pool-note inventory (not display headlines). */
export const PREP_MEASURE_SHORT_LABEL: Record<PrepMeasureId, string> = {
  1: "correction move",
  2: "visible ask",
  3: "named cost",
  4: "conclusion finish",
  5: "frame-break",
  6: "Christ in a main point",
  7: "reciprocal ask",
  8: "gospel reach",
  9: "named-person valence",
  10: "hearer-owned condition",
  11: "delight with an object",
  12: "non-Christian address",
};

export type PrepPoolNoteInput = {
  sampleSize: number;
  manuscriptCount: number;
  transcriptCount: number;
  /** Measures that entered ranking (rate != null), with eligible sermon counts. */
  ranked: Array<{ id: PrepMeasureId; eligible: number }>;
  /** How many of those are actionable (focus-eligible). */
  actionableRankedCount: number;
};

function formatSplit(input: PrepPoolNoteInput): string {
  const { sampleSize, manuscriptCount, transcriptCount } = input;
  if (sampleSize <= 0) {
    return "no sermons";
  }
  if (manuscriptCount > 0 && transcriptCount > 0) {
    return `${manuscriptCount} manuscripts, ${transcriptCount} transcripts`;
  }
  if (transcriptCount === sampleSize) {
    return "all transcripts";
  }
  if (manuscriptCount === sampleSize) {
    return "all manuscripts";
  }
  return `${sampleSize} sermons`;
}

function inventoryLine(
  ranked: Array<{ id: PrepMeasureId; eligible: number }>,
): string {
  return ranked
    .map((row) => {
      const label = PREP_MEASURE_SHORT_LABEL[row.id];
      if (row.id === 4 || row.id === 5) {
        return `${label} (${row.eligible} manuscripts)`;
      }
      return `${label} (${row.eligible} sermons)`;
    })
    .join("; ");
}

/**
 * Plain note: what was ranked, how many sermons supported each measure,
 * and the manuscript/transcript split. No implication that all twelve ran.
 */
export function prepCardPoolNote(input: PrepPoolNoteInput): string {
  const { sampleSize, manuscriptCount, transcriptCount, ranked, actionableRankedCount } =
    input;
  const n = ranked.length;
  const split = formatSplit(input);

  if (n === 0) {
    return `No measures could be ranked on your last ${sampleSize} sermons (${split}).`;
  }

  const head =
    n >= 12
      ? `Built from all twelve measures on your last ${sampleSize} sermons (${split}).`
      : n === 1
        ? `Built from 1 measured discipline on your last ${sampleSize} sermons (${split}), not the full twelve.`
        : `Built from ${n} measured disciplines on your last ${sampleSize} sermons (${split}), not the full twelve.`;

  const inventory = `Ranked on: ${inventoryLine(ranked)}.`;

  let focusNote: string;
  if (actionableRankedCount === 0) {
    focusNote =
      "No actionable measures ranked on this sample, so the focus column is empty.";
  } else if (manuscriptCount === 0 && transcriptCount > 0) {
    focusNote =
      `Focus is drawn from the ${actionableRankedCount} actionable measure${actionableRankedCount === 1 ? "" : "s"} that apply to transcripts. Conclusion finish and frame-break need manuscripts and were not ranked` +
      (actionableRankedCount < 3
        ? ", so this card names fewer than three focus areas rather than inventing them."
        : ". Three actionable measures is the floor for a full focus three only when none of them are also claimed as strengths.");
  } else if (actionableRankedCount < 3) {
    focusNote = `Focus is drawn from only ${actionableRankedCount} actionable measure${actionableRankedCount === 1 ? "" : "s"} on this sample, so the focus column names fewer than three rather than inventing work.`;
  } else {
    focusNote = `Focus is drawn from the ${actionableRankedCount} actionable measures in that set. Strengths also use the strengths-only measures that are live.`;
    if (transcriptCount > 0 && manuscriptCount > 0) {
      focusNote +=
        " Conclusion finish and frame-break use manuscripts only.";
    }
  }

  return `${head} ${inventory} ${focusNote}`;
}

export function formatPrepCount(hits: number, eligible: number): string {
  return `${hits} of ${eligible}`;
}
