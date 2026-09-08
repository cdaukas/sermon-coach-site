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
    strengthHeadline: "Jesus does things in your sentences.",
    strengthLine:
      "He carries, absorbs, finishes, comes back — the subject of a verb, not only a modifier attached to a noun.",
    focusHeadline: "Give Christ a verb.",
    focusLine:
      "Christ appears in the genitive — the grace of Christ, the work of Christ — and almost never does anything. That is a sentence problem, and it is fixable.",
    ask: "What is Christ doing in this week's text?",
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
      "Across 4,227 numbered points in 497 sermons, 21 have Jesus doing something. That is one in two hundred. So this is not a mark against you; it is an open door most preachers walk past.",
    ask: "Which point in this sermon could have Christ as its subject?",
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
    strengthHeadline: "The cross has a named object.",
    strengthLine:
      "When you name the cross you say what it dealt with — wrath, the curse, the debt, the grave — so people can tell you what happened rather than only that something did.",
    focusHeadline: "Name what the cross dealt with.",
    focusLine:
      "Your cross sentences are mostly placeholders until they name a specific thing absorbed, paid, or broken.",
    ask: "At the cross he absorbed ___. Can I fill the blank from this passage?",
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
    strengthHeadline: "The gospel is in your skeleton.",
    strengthLine:
      "A gospel word sits in a numbered main point, so the gospel carries the argument rather than warming it at the end.",
    focusHeadline: "Put the gospel in a main point.",
    focusLine:
      "If every gospel sentence could be deleted and the argument still stood, the gospel is warming the sermon rather than holding it up.",
    ask: "Would this sermon's argument still stand if I deleted every gospel sentence?",
  },
  12: {
    id: 12,
    strengthHeadline: "You remember the person who does not yet believe",
    strengthLine:
      "Your preaching leaves room for the unbeliever. You address him rather than assuming everyone listening already believes.",
    focusHeadline: "Speak to the person who has not decided.",
    focusLine:
      "Address him once, earlier than the last ninety seconds, and give him something to do.",
    ask: "In this sermon, what am I asking the person who does not yet believe?",
  },
};

export const PREP_CARD_REVERENCE = {
  label: "Before you preach anything hard",
  body: "On any text of judgment, wrath, or suffering: would this joke or clever aside survive if the grieving person in row three were the only listener?",
  cut: "If not, cut it.",
} as const;

export const PREP_CARD_STANDING_STRENGTH =
  "Self-aimed humor is a strength, not a lapse. Keep it.";

/** Theme question at the top of the report. Methodology lives in the footer. */
export const PREP_THEME_QUESTION = {
  ask: "Does your ask land on anyone?",
  christ: "Does Christ act in this sermon, or is he its destination?",
} as const;

/** Short labels for pool-note inventory (not display headlines). */
export const PREP_MEASURE_SHORT_LABEL: Record<PrepMeasureId, string> = {
  1: "Christ agency in prose",
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
 * Compact method-footer line: sample, date, format split, measure count.
 * One "Built from" sentence — do not append a second sample line in the view.
 */
export function prepBuiltFromSummary(params: {
  rankedMeasureCount: number;
  sampleSize: number;
  manuscriptCount: number;
  transcriptCount: number;
  /** Already formatted for display, e.g. "5 September 2026". */
  dateLabel: string;
}): string {
  const {
    rankedMeasureCount,
    sampleSize,
    manuscriptCount,
    transcriptCount,
    dateLabel,
  } = params;
  const sermonWord = sampleSize === 1 ? "sermon" : "sermons";
  const disciplineWord =
    rankedMeasureCount === 1 ? "measured discipline" : "measured disciplines";

  let split = "";
  if (manuscriptCount > 0 && transcriptCount > 0) {
    split = ` — ${manuscriptCount} manuscripts and ${transcriptCount} transcripts`;
  } else if (manuscriptCount === sampleSize && sampleSize > 0) {
    split = " — all manuscripts";
  } else if (transcriptCount === sampleSize && sampleSize > 0) {
    split = " — all transcripts";
  }

  return `Built from ${sampleSize} ${sermonWord} on ${dateLabel}${split} — across ${rankedMeasureCount} ${disciplineWord}.`;
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
  if (measureId === 1) {
    return `${hits} of ${eligible} Christ mentions`;
  }
  if (measureId === 4 || measureId === 5 || measureId === 11) {
    return `${hits} of your ${eligible} manuscripts`;
  }
  if (measureId === 6) {
    return `${hits} of your ${eligible} manuscripts`;
  }
  return `${hits} of ${eligible} sermons`;
}

/**
 * Manuscript-only measures: when eligible < sampleSize, name the
 * transcripts that could not be scored — at the point of use.
 */
export function formatPrepDenominatorNote(
  eligible: number,
  sampleSize: number,
  measureId: PrepMeasureId,
): string | null {
  if (eligible >= sampleSize || sampleSize <= 0) {
    return null;
  }
  const dropped = sampleSize - eligible;
  if (
    measureId === 4 ||
    measureId === 5 ||
    measureId === 6 ||
    measureId === 11
  ) {
    if (dropped === 1) {
      return "One came in as a transcript and has no outline to read.";
    }
    const word =
      dropped === 2
        ? "Two"
        : dropped === 3
          ? "Three"
          : dropped === 4
            ? "Four"
            : dropped === 5
              ? "Five"
              : dropped === 6
                ? "Six"
                : String(dropped);
    return `${word} came in as transcripts and have no outline to read.`;
  }
  return null;
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
      "Jesus does things in your sentences. He carries, absorbs, finishes, comes back. That sounds obvious and it is not what most preaching does. The common shape is Christ as a modifier — the blood of Christ, the mission of Christ, the love of Christ — where he is attached to a noun and never picks anything up. When he is the subject of a verb, the sermon has somewhere to move.",
    low:
      "Christ appears constantly in your preaching and he almost never does anything. He shows up in the genitive: the grace of Christ, the work of Christ, the name of Christ. Grammatically he is furniture. This is not a doctrine problem, it is a sentence problem, and it is the single most fixable thing in this report. Give him a verb and watch what has to change around it.",
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
      "Jesus does something in the skeleton of your sermon, not just in the paragraphs. Across 4,227 numbered points in 497 sermons, 21 have Jesus doing something. When he acts in the outline, the sermon's movement is his movement. The application then has somewhere to come from.",
    low:
      "Across 4,227 numbered points in 497 sermons, 21 have Jesus doing something. That is one in two hundred. So this is not a mark against you; it is an open door most preachers walk past. Your points name topics and truths, and Christ shows up inside them doing the explaining. Make him the subject of one point and the sermon has to go somewhere it was not already going.",
  },
  7: {
    high:
      "Your applications need somebody else in the room. Most application can be obeyed alone, with the door shut, and a congregation trained that way quietly stops needing each other. When the ask has another person as its object, the sermon builds a church instead of a room full of individuals who happen to be seated together.",
    low:
      "Everything you asked for could be done with the door shut. Confession, forgiveness, encouragement, reconciliation. The obediences that most need a church are the easiest ones to hand back as private, and private is the default. This is not a warmth problem. Your preaching is warm. The ask just keeps landing on one man's inner life instead of on what two people in that room owe each other.",
  },
  8: {
    high:
      "That specificity is what separates a gospel sentence from a gospel gesture.",
    low:
      "The hearer supplies the content or he does not, and mostly he does not. A cross with a named object is a cross a person can picture.",
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
      "The gospel is in your outline, not only in your prose. That is the clearest structural difference between a sermon where the gospel carries an argument and one where it is applied at the end like a coat of paint. Twenty of forty-one load-bearing sermons put a gospel word in a numbered point. One of fourteen removable ones did.",
    low:
      "Your gospel lives in the paragraphs and never in the frame. Delete every gospel sentence and the argument still stands, which means the gospel is warming the sermon rather than holding it up. Put a gospel word in one main point and you will find out quickly whether the rest of that point still works.",
  },
  12: {
    high:
      "You talk to the person who has not decided. Most sermons address the in-group by default and remember him in the last ninety seconds, if at all. Yours does not, and the people in your room who are still working it out know that.",
    low:
      "Your preaching assumes everyone listening already believes. Across 443 sermons in this corpus the unbeliever is addressed in about one in five, at a median of ninety percent of the way through, and exactly one asks him to do anything physical. He is described his danger and given no verb. Speak to him once, in the first half, and give him something to do.",
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
