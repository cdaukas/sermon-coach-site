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

/**
 * Single count caption. Do not append a second denominator.
 * Manuscripts (4/5): "6 of your 18 manuscripts"
 * Sermons: "8 of 24 sermons"
 */
export function formatPrepCountCaption(
  hits: number,
  eligible: number,
  measureId: PrepMeasureId,
): string {
  if (measureId === 4 || measureId === 5) {
    return `${hits} of your ${eligible} manuscripts`;
  }
  return `${hits} of ${eligible} sermons`;
}

/**
 * When the 50% strength floor leaves fewer slots than the card would
 * otherwise name, explain rather than invent strengths.
 */
export function prepStrengthsFloorNote(params: {
  shown: number;
  target: number;
  clearedFloor: number;
}): string | null {
  const { shown, target, clearedFloor } = params;
  if (clearedFloor >= target) {
    return null;
  }
  if (shown === 0 || clearedFloor === 0) {
    return "No measure cleared 50% of its eligible sample, so this card names no strengths rather than praising a habit that is still rare.";
  }
  if (clearedFloor === 1) {
    return "Only one measure cleared 50% of its eligible sample, so this card names one strength rather than inventing more.";
  }
  return `Only ${clearedFloor} measures cleared 50% of their eligible sample, so this card names ${clearedFloor} strengths rather than inventing more.`;
}

/** @deprecated Prefer formatPrepCountCaption — kept for older call sites. */
export function formatPrepCount(hits: number, eligible: number): string {
  return `${hits} of ${eligible}`;
}

/**
 * Interpretation layer: what the count means about how this preacher
 * preaches. Fixed copy per measure, keyed high (strength) / low (focus).
 * The model does not write these.
 * Source: claude/prep-card-interpretation-copy.md (rewritten 5 Sep 2026).
 */
export type PrepInterpretationBand = "high" | "low";

export type PrepMeasureInterpretation = {
  high: string | null;
  low: string | null;
};

export const PREP_MEASURE_INTERPRETATION: Record<
  PrepMeasureId,
  PrepMeasureInterpretation
> = {
  1: {
    high:
      "You let the text argue back, and you leave the argument in. Most preachers walk into a passage with the sermon mostly written and use the verses to confirm it. Nothing surprises anybody, including the preacher. When you say out loud what you expected and then admit the text says otherwise, the room watches you get corrected by the Bible. That teaches more about reading Scripture than the point you were making.",
    low:
      "You mostly find what you came looking for. The point is true, the passage supports it, nothing on the page is wrong. But you walked in with the list already written. That's shopping, not reading. The strongest work in this corpus always has a moment where the text refuses the preacher and he says so out loud.",
  },
  2: {
    high:
      "When you ask for something, a person can tell whether they did it. That sounds small. It is the hardest thing in application. Most preaching asks for a change of posture, and posture cannot be checked on Tuesday. You hand people something with edges, which means they can succeed at it and they can fail at it. Both beat a mood.",
    low:
      "Your asks are mostly interior. Believe, trust, see, remember. Every one of them true, and most of them what the text is actually after. But nobody in the room could tell whether they obeyed. This is what happens when the application gets written after the sermon instead of into it. An ask nobody can see is an ask nobody makes.",
  },
  3: {
    high:
      "You tell people what obedience will take from them before you ask for it. Most preaching leaves the price tag off, either out of kindness or because the preacher never counted it himself. Naming the cost does two jobs at once. It makes the ask honest, and it makes refusal possible. That is what makes a yes mean anything.",
    low:
      "Almost none of your asks name a price. Your instinct is to protect people from law, and that instinct is right. It is one of the best things about your preaching. And also this is true: an ask that costs nothing does not need a yes. Your people sit under real preaching and decide nothing, because nothing was ever on the table.",
  },
  4: {
    high:
      "Your endings are written, not assembled. The hook usually gets Tuesday and the landing usually gets eleven o'clock Saturday night, which is why most conclusions are three bullets and a prayer. Yours land where you decided they would land. That is the part people carry to the car.",
    low:
      "Your openings get Tuesday. Your endings get eleven o'clock Saturday. It shows on the page, where the prose thins out into fragments and labels right at the moment the sermon is supposed to arrive. This is a preparation pattern, not a preaching one. You may well have landed it fine from notes. But the last ninety seconds are the only part a person still has on Monday, and right now they are getting whatever is left of you.",
  },
  5: {
    high:
      "Your points come out of the passage instead of getting carried in. The tell is grammatical. An imported point almost never matches the pattern of the others, because it came from somewhere else. Yours hold together, which means the shape of the sermon is the shape of the text.",
    low:
      "One of your points came in your bag. It is not a false point. It is true, it fits the topic, and it is not what this passage is doing. You can spot it in ten seconds by writing the heads in a column and looking for the one that breaks the pattern. That is the point you brought rather than found, and it is how a sermon ends up being about a subject the text only mentions.",
  },
  6: {
    high:
      "Jesus does something in the skeleton of your sermon, not just in the paragraphs. Across nearly five hundred manuscripts, Christ is the subject of an action verb in about one numbered point in two hundred. When he acts in the outline, the sermon's movement is his movement. The application then has somewhere to come from.",
    low:
      "Christ is in every room of the house and never on the deed. He is named, praised, returned to, and the argument would still stand without him. Corpus-wide that is normal: one numbered point in two hundred has Jesus doing something. It is still the difference between a sermon that mentions Christ and one that is carried by him. Put him in one main point and watch where the sermon has to go instead.",
  },
  7: {
    high:
      "Your applications need somebody else in the room. Most application can be obeyed alone, with the door shut, and a congregation trained that way quietly stops needing each other. When the ask has another person as its object, the sermon builds a church instead of a room full of individuals who happen to be seated together.",
    low:
      "Everything you asked for could be done with the door shut. Confession, forgiveness, encouragement, reconciliation. The obediences that most need a church are the easiest ones to hand back as private, and private is the default. This is not a warmth problem. Your preaching is warm. The ask just keeps landing on one man's inner life instead of on what two people in that room owe each other.",
  },
  8: {
    high:
      "No text stays landlocked. Whatever the passage is doing, you find the slope down to what God has done in Christ, and most weeks you find it without forcing the channel. That is a reflex you trained, not a technique you apply. Nobody goes home from your preaching with behavior modification and a smile.",
    low: null,
  },
  9: {
    high:
      "You name people from the pulpit and never at their expense. Not one person named in your preaching has been named in fault. Most preachers protect the room by naming nobody, or they name people and eventually somebody becomes the example. You do the harder thing. Specific about persons, specific about sin, and never the same specific.",
    low: null,
  },
  10: {
    high:
      "When you name what is wrong, it belongs to the people in front of you. The usual failure is not skipping the condition. It is naming one that has no owner, some unspecified plural that never resolves into anybody. Yours resolves. The man in row three knows the sentence is about him.",
    low: null,
  },
  11: {
    high:
      "When you enjoy the text, people can tell what you are enjoying. A preacher can be visibly moved and never say what moved him, and the room learns to admire his warmth instead of the passage. You point at something. A word, a turn, a thing the text does that it did not have to do. Pointing is how people learn to find it themselves.",
    low: null,
  },
  12: {
    high:
      "Somebody outside the faith gets addressed in your preaching instead of assumed absent. Most sermons talk to the in-group by default and remember the unbeliever in the last ninety seconds, if at all. Yours does not. The people who have not decided yet know your room has room for them.",
    low: null,
  },
};

/**
 * Paragraph between the count and the example (or after the count on
 * strengths). Returns null when that band has no copy.
 */
export function prepInterpretationParagraph(
  measureId: PrepMeasureId,
  band: PrepInterpretationBand,
): string | null {
  const text = PREP_MEASURE_INTERPRETATION[measureId][band];
  if (text == null) {
    return null;
  }
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}
