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
    // Temporarily dual-end until more of the actionable seven ship.
    focusHeadline: "Address the person who does not yet believe",
    focusLine:
      "Someone outside the faith is in the room. Speak to him rather than assuming everyone listening already believes.",
    ask: "Where does this sermon leave the person who does not yet believe?",
  },
};

export const PREP_CARD_REVERENCE = {
  label: "Before you preach anything hard",
  body: "On any text of judgment, wrath, or suffering: would this joke or clever aside survive if the grieving person in row three were the only listener?",
  cut: "If not, cut it.",
} as const;

export const PREP_CARD_STANDING_STRENGTH =
  "Self-aimed humor is a strength, not a lapse. Keep it.";

export function prepCardPoolNote(rankedMeasureCount: number): string {
  if (rankedMeasureCount >= 12) {
    return "Built from all twelve measures.";
  }
  if (rankedMeasureCount === 1) {
    return "Built from 1 measured discipline. More measures will join this card as their counters land.";
  }
  return `Built from ${rankedMeasureCount} measured disciplines, not the full twelve. Strengths and focus are drawn from those ${rankedMeasureCount} until more counters ship.`;
}

export function formatPrepCount(hits: number, eligible: number): string {
  return `${hits} of ${eligible}`;
}
